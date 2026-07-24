import type { Logger } from '@slack/bolt';
import type { WebClient } from '@slack/web-api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BOT_MENTION_NAME } from '../config/constants';
import type { ReactionMapping } from '../models/reactionMapping';
import type { ReactionOperations } from '../services/reactionService';
import { ReactionCommand } from './reactionCommand';
import type { CommandContext, SayFunction, SlackEvent } from './types';

const reactionService = {
  findMatchingMappings: vi.fn(),
  addReactionMapping: vi.fn(),
  removeReactionMapping: vi.fn(),
  getAllReactionMappings: vi.fn(),
  incrementReactionUsage: vi.fn(),
} satisfies ReactionOperations;

function createContext(
  args: string[],
  eventOverrides: Partial<SlackEvent> = {},
): {
  context: CommandContext;
  say: ReturnType<typeof vi.fn>;
  uploadV2: ReturnType<typeof vi.fn>;
} {
  const event = {
    type: 'message',
    user: 'U123',
    channel: 'C123',
    channel_type: 'channel',
    event_ts: '100.000',
    ts: '100.000',
    text: `reaction ${args.join(' ')}`,
    ...eventOverrides,
  } as SlackEvent;
  const say = vi.fn().mockResolvedValue({ ok: true });
  const uploadV2 = vi.fn().mockResolvedValue({ ok: true });

  return {
    context: {
      event,
      say: say as SayFunction,
      logger: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        setName: vi.fn(),
        setLevel: vi.fn(),
        getLevel: vi.fn(),
      } as unknown as Logger,
      args,
      invokedName: 'reaction',
      client: {
        files: {
          uploadV2,
        },
      } as unknown as WebClient,
    },
    say,
    uploadV2,
  };
}

const mapping = (overrides: Partial<ReactionMapping> = {}): ReactionMapping => ({
  id: 1,
  triggerText: 'hello',
  reaction: ':wave:',
  usageCount: 2,
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-02 00:00:00',
  ...overrides,
});

describe('ReactionCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('コマンド情報とヘルプを返す', () => {
    const command = new ReactionCommand(reactionService);

    expect(command.description).toBe(
      'リアクションマッピングを管理します（チャンネルメッセージに自動的にリアクションを追加）',
    );
    expect(command.getExamples('reaction')).toEqual([
      `${BOT_MENTION_NAME} reaction export`,
      `${BOT_MENTION_NAME} reaction add トリガー :emoji:`,
      `${BOT_MENTION_NAME} reaction remove トリガー :emoji:`,
    ]);
    expect(command.getHelpText('reaction')).toBe(
      `*reaction* - ${command.description}\n` +
        `  - \`${BOT_MENTION_NAME} reaction export\` - すべてのリアクションマッピングをCSV形式でエクスポート\n` +
        `  - \`${BOT_MENTION_NAME} reaction add トリガー :emoji:\` - リアクションマッピングを追加\n` +
        `  - \`${BOT_MENTION_NAME} reaction remove トリガー :emoji:\` - リアクションマッピングを削除\n\n`,
    );
  });

  it('サブコマンドがない場合は元メッセージのスレッドへ案内する', async () => {
    const { context, say } = createContext([]);

    await new ReactionCommand(reactionService).execute(context);

    expect(say).toHaveBeenCalledWith({
      text: 'サブコマンドを指定してください（export, add, remove）。',
      thread_ts: '100.000',
    });
  });

  it('未知のサブコマンドを小文字化して既存スレッドへ案内する', async () => {
    const { context, say } = createContext(['UNKNOWN'], { thread_ts: '90.000' });

    await new ReactionCommand(reactionService).execute(context);

    expect(say).toHaveBeenCalledWith({
      text: '未知のサブコマンド: unknown\n有効なサブコマンド: export, add, remove',
      thread_ts: '90.000',
    });
  });

  it.each(['add', 'remove'])('%sの引数が不足している場合は案内する', async (subCommand) => {
    const { context, say } = createContext([subCommand, 'trigger']);

    await new ReactionCommand(reactionService).execute(context);

    expect(say).toHaveBeenCalledWith({
      text: 'トリガーテキストとリアクションを指定してください。',
      thread_ts: '100.000',
    });
    expect(reactionService.addReactionMapping).not.toHaveBeenCalled();
    expect(reactionService.removeReactionMapping).not.toHaveBeenCalled();
  });

  it('検証済みトリガーでマッピングを追加する', async () => {
    reactionService.addReactionMapping.mockReturnValue(1);
    const { context, say } = createContext(['add', ' hello ', ':wave:']);

    await new ReactionCommand(reactionService).execute(context);

    expect(reactionService.addReactionMapping).toHaveBeenCalledWith('hello', ':wave:');
    expect(say).toHaveBeenCalledWith({
      text: 'リアクションマッピングを追加しました: "hello" → :wave:',
      thread_ts: '100.000',
    });
  });

  it('addの検証失敗をスレッド返信用ValidationErrorへ変換する', async () => {
    const { context, say } = createContext(['add', '', ':wave:']);

    await expect(new ReactionCommand(reactionService).execute(context)).rejects.toMatchObject({
      name: 'ValidationError',
      message: 'Empty trigger text',
      userMessage: 'バリデーションエラー: Empty trigger text',
      context: { providedText: '' },
      replyMode: 'message-thread',
    });
    expect(reactionService.addReactionMapping).not.toHaveBeenCalled();
    expect(say).not.toHaveBeenCalled();
  });

  it('addのDB失敗をスレッド返信用DatabaseErrorへ変換する', async () => {
    reactionService.addReactionMapping.mockImplementation(() => {
      throw new Error('db down');
    });
    const { context, say } = createContext(['add', 'hello', ':wave:']);

    await expect(new ReactionCommand(reactionService).execute(context)).rejects.toMatchObject({
      name: 'DatabaseError',
      message: 'Failed to add reaction mapping',
      userMessage: 'リアクションマッピングの追加に失敗しました: db down',
      context: {
        triggerText: 'hello',
        reaction: ':wave:',
        error: 'db down',
      },
      replyMode: 'message-thread',
    });
    expect(say).not.toHaveBeenCalled();
  });

  it('存在するマッピングを削除する', async () => {
    reactionService.removeReactionMapping.mockReturnValue(true);
    const { context, say } = createContext(['remove', 'hello', ':wave:']);

    await new ReactionCommand(reactionService).execute(context);

    expect(reactionService.removeReactionMapping).toHaveBeenCalledWith('hello', ':wave:');
    expect(say).toHaveBeenCalledWith({
      text: 'リアクションマッピングを削除しました: "hello" → :wave:',
      thread_ts: '100.000',
    });
  });

  it('存在しないマッピングの削除を案内する', async () => {
    reactionService.removeReactionMapping.mockReturnValue(false);
    const { context, say } = createContext(['remove', 'missing', ':eyes:']);

    await new ReactionCommand(reactionService).execute(context);

    expect(say).toHaveBeenCalledWith({
      text: 'リアクションマッピング "missing" → :eyes: は存在しません。',
      thread_ts: '100.000',
    });
  });

  it('removeのDB失敗は現在のサービスエラーをそのまま伝播する', async () => {
    reactionService.removeReactionMapping.mockImplementation(() => {
      throw new Error('db down');
    });
    const { context, say } = createContext(['remove', 'hello', ':wave:']);

    await expect(new ReactionCommand(reactionService).execute(context)).rejects.toThrow('db down');
    expect(say).not.toHaveBeenCalled();
  });

  it('マッピングが0件の場合はファイルをアップロードせず案内する', async () => {
    reactionService.getAllReactionMappings.mockReturnValue([]);
    const { context, say, uploadV2 } = createContext(['export']);

    await new ReactionCommand(reactionService).execute(context);

    expect(reactionService.getAllReactionMappings).toHaveBeenCalledOnce();
    expect(uploadV2).not.toHaveBeenCalled();
    expect(say).toHaveBeenCalledWith({
      text: 'エクスポートするリアクションマッピングはありません。',
      thread_ts: '100.000',
    });
  });

  it('CSVを日時付きファイル名で既存スレッドへアップロードする', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-25T01:02:03.456Z'));
    reactionService.getAllReactionMappings.mockReturnValue([
      mapping({ triggerText: 'hello,world' }),
    ]);
    const { context, say, uploadV2 } = createContext(['export'], { thread_ts: '90.000' });

    await new ReactionCommand(reactionService).execute(context);

    const csv =
      'ID,トリガーテキスト,リアクション,使用回数,作成日時,更新日時\n' +
      '1,"hello,world",:wave:,2,2026-01-01 00:00:00,2026-01-02 00:00:00\n';
    expect(uploadV2).toHaveBeenCalledWith({
      channel_id: 'C123',
      initial_comment: 'リアクションマッピングをCSVファイルとしてエクスポートしました。',
      file_uploads: [
        {
          file: Buffer.from(csv, 'utf-8'),
          filename: 'reaction-mappings-2026-07-25T01-02-03-456Z.csv',
          title: 'リアクションマッピング一覧',
        },
      ],
      thread_ts: '90.000',
    });
    expect(say).not.toHaveBeenCalled();
  });

  it('チャンネル直下のexportも元メッセージのtsをアップロード先スレッドにする', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-25T01:02:03.456Z'));
    reactionService.getAllReactionMappings.mockReturnValue([mapping()]);
    const { context, uploadV2 } = createContext(['export']);

    await new ReactionCommand(reactionService).execute(context);

    expect(uploadV2).toHaveBeenCalledWith(
      expect.objectContaining({
        channel_id: 'C123',
        thread_ts: '100.000',
      }),
    );
  });

  it('アップロード失敗をスレッド返信用SlackAPIErrorへ変換する', async () => {
    reactionService.getAllReactionMappings.mockReturnValue([mapping()]);
    const { context, say, uploadV2 } = createContext(['export']);
    uploadV2.mockRejectedValue(new Error('slack down'));

    await expect(new ReactionCommand(reactionService).execute(context)).rejects.toMatchObject({
      name: 'SlackAPIError',
      message: 'Failed to export reaction mappings',
      userMessage: 'リアクションマッピングのエクスポートに失敗しました: slack down',
      context: {
        channel: 'C123',
        error: 'slack down',
      },
      replyMode: 'message-thread',
    });
    expect(say).not.toHaveBeenCalled();
  });
});
