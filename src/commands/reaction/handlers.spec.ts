import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleExport } from './exportHandler';
import { handleAdd } from './addHandler';
import { handleRemove } from './removeHandler';
import { ReactionSubcommandContext } from './types';
import { SayFunction, SlackEvent } from '../types';
import { Logger } from '@slack/bolt';
import { WebClient } from '@slack/web-api';
import type { IReactionService } from '../../features/reaction';

describe('Reaction Handlers', () => {
  let mockReactionService: IReactionService;
  let mockSay: SayFunction;
  let mockLogger: Logger;
  let mockEvent: SlackEvent;
  let mockClient: WebClient;

  const createContext = (
    subcommandArgs: string[] = [],
    overrides: Partial<ReactionSubcommandContext> = {},
  ): ReactionSubcommandContext => ({
    event: mockEvent,
    say: mockSay,
    logger: mockLogger,
    args: [],
    client: mockClient,
    reactionService: mockReactionService,
    subcommandArgs,
    replyOptions: { thread_ts: mockEvent.ts },
    ...overrides,
  });

  beforeEach(() => {
    mockReactionService = {
      getAllReactionMappings: vi.fn(),
      getMatchingMappings: vi.fn(),
      addReactionMapping: vi.fn(),
      removeReactionMapping: vi.fn(),
      incrementReactionUsage: vi.fn(),
    };

    mockSay = vi.fn().mockResolvedValue({
      ok: true,
      channel: 'C123456',
      ts: '1234567890.123456',
    });

    mockLogger = {
      error: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      setLevel: vi.fn(),
      getLevel: vi.fn(),
      setName: vi.fn(),
    } as Logger;

    mockEvent = {
      type: 'message',
      user: 'U123456',
      channel: 'C123456',
      channel_type: 'channel',
      event_ts: '1234567890.123456',
      ts: '1234567890.123456',
      text: 'reaction',
    } as SlackEvent;

    mockClient = {
      files: {
        uploadV2: vi.fn().mockResolvedValue({ ok: true }),
      },
    } as unknown as WebClient;

    vi.clearAllMocks();
  });

  describe('handleExport', () => {
    it('CSVファイルをアップロードすること', async () => {
      vi.mocked(mockReactionService.getAllReactionMappings).mockReturnValue([
        {
          id: 1,
          triggerText: 'hello',
          reaction: ':wave:',
          usageCount: 10,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ]);

      await handleExport(createContext());

      expect(mockClient.files.uploadV2).toHaveBeenCalledWith(
        expect.objectContaining({
          channel_id: 'C123456',
          initial_comment: 'リアクションマッピングをCSVファイルとしてエクスポートしました。',
          thread_ts: '1234567890.123456',
        }),
      );
    });

    it('マッピングが空の場合にメッセージを表示すること', async () => {
      vi.mocked(mockReactionService.getAllReactionMappings).mockReturnValue([]);

      await handleExport(createContext());

      expect(mockSay).toHaveBeenCalledWith({
        text: 'エクスポートするリアクションマッピングはありません。',
        thread_ts: '1234567890.123456',
      });
      expect(mockClient.files.uploadV2).not.toHaveBeenCalled();
    });

    it('スレッド内で返信すること', async () => {
      const threadEvent = {
        ...mockEvent,
        thread_ts: '123456789.111111',
      };
      vi.mocked(mockReactionService.getAllReactionMappings).mockReturnValue([]);

      await handleExport(
        createContext([], {
          event: threadEvent,
          replyOptions: { thread_ts: '123456789.111111' },
        }),
      );

      expect(mockSay).toHaveBeenCalledWith({
        text: expect.any(String),
        thread_ts: '123456789.111111',
      });
    });
  });

  describe('handleAdd', () => {
    it('リアクションマッピングを追加すること', async () => {
      await handleAdd(createContext(['hello', ':wave:']));

      expect(mockReactionService.addReactionMapping).toHaveBeenCalledWith('hello', ':wave:');
      expect(mockSay).toHaveBeenCalledWith({
        text: 'リアクションマッピングを追加しました: "hello" → :wave:',
        thread_ts: '1234567890.123456',
      });
    });

    it('引数が足りない場合にエラーメッセージを表示すること', async () => {
      await handleAdd(createContext(['hello']));

      expect(mockReactionService.addReactionMapping).not.toHaveBeenCalled();
      expect(mockSay).toHaveBeenCalledWith({
        text: 'トリガーテキストとリアクションを指定してください。',
        thread_ts: '1234567890.123456',
      });
    });
  });

  describe('handleRemove', () => {
    it('リアクションマッピングを削除すること', async () => {
      vi.mocked(mockReactionService.removeReactionMapping).mockReturnValue(true);

      await handleRemove(createContext(['hello', ':wave:']));

      expect(mockReactionService.removeReactionMapping).toHaveBeenCalledWith('hello', ':wave:');
      expect(mockSay).toHaveBeenCalledWith({
        text: 'リアクションマッピングを削除しました: "hello" → :wave:',
        thread_ts: '1234567890.123456',
      });
    });

    it('存在しないマッピングの場合にエラーメッセージを表示すること', async () => {
      vi.mocked(mockReactionService.removeReactionMapping).mockReturnValue(false);

      await handleRemove(createContext(['hello', ':wave:']));

      expect(mockSay).toHaveBeenCalledWith({
        text: 'リアクションマッピング "hello" → :wave: は存在しません。',
        thread_ts: '1234567890.123456',
      });
    });

    it('引数が足りない場合にエラーメッセージを表示すること', async () => {
      await handleRemove(createContext(['hello']));

      expect(mockReactionService.removeReactionMapping).not.toHaveBeenCalled();
      expect(mockSay).toHaveBeenCalledWith({
        text: 'トリガーテキストとリアクションを指定してください。',
        thread_ts: '1234567890.123456',
      });
    });
  });
});
