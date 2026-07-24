import type { Logger } from '@slack/bolt';
import type { WebClient } from '@slack/web-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BOT_MENTION_NAME } from '../config/constants';
import type { Group, GroupItem } from '../models/group';
import { GroupService } from '../services/groupService';
import { DatabaseError, ValidationError } from '../utils/errors';
import { GroupCommand } from './groupCommand';
import type { CommandContext, SayFunction, SlackEvent } from './types';

vi.mock('../services/groupService', () => ({
  GroupService: {
    getAllGroups: vi.fn(),
    createGroup: vi.fn(),
    deleteGroup: vi.fn(),
    getItemsByGroupName: vi.fn(),
    addItemToGroup: vi.fn(),
    addItemsToGroup: vi.fn(),
    removeItemFromGroup: vi.fn(),
    clearGroupItems: vi.fn(),
  },
}));

const ts = '100.000';
const threadTs = '99.000';

function createContext(args: string[], eventThreadTs?: string): CommandContext {
  const event = {
    type: 'message',
    user: 'U123',
    channel: 'C123',
    channel_type: 'channel',
    event_ts: ts,
    ts,
    text: `group ${args.join(' ')}`,
    ...(eventThreadTs === undefined ? {} : { thread_ts: eventThreadTs }),
  } as SlackEvent;

  return {
    event,
    say: vi.fn().mockResolvedValue({ ok: true }) as SayFunction,
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
    invokedName: 'group',
    client: {} as WebClient,
  };
}

async function execute(args: string[], eventThreadTs?: string): Promise<CommandContext> {
  const context = createContext(args, eventThreadTs);
  await new GroupCommand().execute(context);
  return context;
}

function expectReply(context: CommandContext, text: string, expectedThreadTs = ts): void {
  expect(context.say).toHaveBeenCalledWith({ text, thread_ts: expectedThreadTs });
}

describe('GroupCommand', () => {
  beforeEach(() => vi.clearAllMocks());

  it('ヘルプテキストにすべてのサブコマンドを含める', () => {
    expect(new GroupCommand().getHelpText('group')).toBe(
      '*group* - グループを管理します\n' +
        `  - \`${BOT_MENTION_NAME} group list\` - すべてのグループを表示\n` +
        `  - \`${BOT_MENTION_NAME} group create グループ名\` - 新しいグループを作成\n` +
        `  - \`${BOT_MENTION_NAME} group delete グループ名\` - グループを削除\n` +
        `  - \`${BOT_MENTION_NAME} group items グループ名\` - グループのアイテムを表示\n` +
        `  - \`${BOT_MENTION_NAME} group add グループ名 アイテム...\` - アイテムを追加\n` +
        `  - \`${BOT_MENTION_NAME} group remove グループ名 アイテム\` - アイテムを削除\n` +
        `  - \`${BOT_MENTION_NAME} group clear グループ名\` - グループのすべてのアイテムを削除\n\n`,
    );
  });

  it('サブコマンドなしと未知のサブコマンドに返信する', async () => {
    expectReply(
      await execute([]),
      'サブコマンドを指定してください（list, create, delete, items, add, remove, clear）。',
    );
    expectReply(
      await execute(['WHAT']),
      '未知のサブコマンド: what\n有効なサブコマンド: list, create, delete, items, add, remove, clear',
    );
  });

  it('listは空と一覧を応答し、スレッドTSを使う', async () => {
    vi.mocked(GroupService.getAllGroups).mockReturnValue([]);
    expectReply(await execute(['list'], threadTs), 'グループはありません。', threadTs);
    vi.mocked(GroupService.getAllGroups).mockReturnValue([
      { id: 1, name: '昼食', createdAt: '', updatedAt: '' } as Group,
    ]);
    expectReply(await execute(['list']), '*グループ一覧:*\n昼食');
  });

  it('listのserviceエラーはそのまま伝播する', async () => {
    const error = new Error('list failed');
    vi.mocked(GroupService.getAllGroups).mockImplementation(() => {
      throw error;
    });
    await expect(new GroupCommand().execute(createContext(['list']))).rejects.toBe(error);
  });

  it('createは入力不足、成功、validation失敗を処理する', async () => {
    expectReply(await execute(['create']), 'グループ名を指定してください。');
    const context = await execute(['create', ' 昼食 ']);
    expect(GroupService.createGroup).toHaveBeenCalledWith('昼食');
    expectReply(context, 'グループ "昼食" を作成しました。');
    await expect(new GroupCommand().execute(createContext(['create', ' ']))).rejects.toMatchObject({
      name: 'ValidationError',
      message: 'Empty group name',
      userMessage: 'グループ名を入力してください',
      context: { providedName: ' ' },
    } satisfies Partial<ValidationError>);
  });

  it('createのserviceエラーはDatabaseErrorでラップする', async () => {
    vi.mocked(GroupService.createGroup).mockImplementation(() => {
      throw new Error('duplicate');
    });
    await expect(
      new GroupCommand().execute(createContext(['create', '昼食'])),
    ).rejects.toMatchObject({
      name: 'DatabaseError',
      message: 'Failed to create group',
      userMessage:
        'データベース操作中にエラーが発生しました。しばらく待ってから再試行してください。',
      context: { groupName: '昼食', error: 'duplicate' },
    } satisfies Partial<DatabaseError>);
  });

  it('deleteは入力不足、成功、対象なしを処理する', async () => {
    expectReply(await execute(['delete']), 'グループ名を指定してください。');
    vi.mocked(GroupService.deleteGroup).mockReturnValueOnce(true).mockReturnValueOnce(false);
    expectReply(await execute(['delete', '昼食']), 'グループ "昼食" を削除しました。');
    expectReply(await execute(['delete', 'なし']), 'グループ "なし" は存在しません。');
  });

  it('itemsは入力不足、空、一覧を処理する', async () => {
    expectReply(await execute(['items']), 'グループ名を指定してください。');
    vi.mocked(GroupService.getItemsByGroupName)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([{ id: 1, groupId: 1, itemText: 'うどん', createdAt: '' } as GroupItem]);
    expectReply(await execute(['items', '昼食']), 'グループ "昼食" にはアイテムがありません。');
    expectReply(await execute(['items', '昼食']), '*グループ "昼食" のアイテム:*\nうどん');
  });

  it('addは入力不足、単一追加、対象なしを処理する', async () => {
    expectReply(
      await execute(['add', '昼食']),
      'グループ名と1つ以上のアイテムを指定してください。複数のアイテムを一度に追加することもできます。',
    );
    vi.mocked(GroupService.addItemToGroup).mockReturnValueOnce(1).mockReturnValueOnce(undefined);
    expectReply(
      await execute(['add', '昼食', 'ラーメン']),
      'グループ "昼食" にアイテム "ラーメン" を追加しました。',
    );
    expect(GroupService.addItemToGroup).toHaveBeenLastCalledWith('昼食', 'ラーメン');
    expectReply(await execute(['add', 'なし', 'ラーメン']), 'グループ "なし" は存在しません。');
  });

  it('addは複数アイテムを空白で分割して一括追加する', async () => {
    vi.mocked(GroupService.addItemsToGroup).mockReturnValue([1, 2]);
    const context = await execute(['add', '昼食', 'ラーメン', 'うどん']);
    expect(GroupService.addItemsToGroup).toHaveBeenCalledWith('昼食', ['ラーメン', 'うどん']);
    expectReply(context, 'グループ "昼食" に 2 個のアイテムを追加しました：\nラーメン\nうどん');
  });

  it('複数アイテムの追加対象がない場合を案内する', async () => {
    vi.mocked(GroupService.addItemsToGroup).mockReturnValue([]);

    const context = await execute(['add', 'なし', 'ラーメン', 'うどん']);

    expect(GroupService.addItemsToGroup).toHaveBeenCalledWith('なし', ['ラーメン', 'うどん']);
    expectReply(context, 'グループ "なし" は存在しません。');
  });

  it('addのvalidation失敗とservice失敗は現行のエラー型で伝播する', async () => {
    await expect(
      new GroupCommand().execute(createContext(['add', '昼食', 'x'.repeat(201)])),
    ).rejects.toMatchObject({
      name: 'ValidationError',
      replyMode: 'message-thread',
      userMessage:
        'アイテム "' + 'x'.repeat(201) + '" のバリデーションエラー: Item text too long: 201 chars',
    });
    vi.mocked(GroupService.addItemToGroup).mockImplementation(() => {
      throw new Error('db down');
    });
    await expect(
      new GroupCommand().execute(createContext(['add', '昼食', 'ラーメン'])),
    ).rejects.toMatchObject({
      name: 'DatabaseError',
      message: 'Failed to add group items',
      userMessage: 'アイテムの追加に失敗しました: db down',
      context: {
        groupName: '昼食',
        items: ['ラーメン'],
        error: 'db down',
      },
      replyMode: 'message-thread',
    });
  });

  it('removeは入力不足、成功、対象なしを処理する', async () => {
    expectReply(await execute(['remove', '昼食']), 'グループ名とアイテムを指定してください。');
    vi.mocked(GroupService.removeItemFromGroup)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);
    expectReply(
      await execute(['remove', '昼食', '焼き', 'そば']),
      'グループ "昼食" からアイテム "焼き そば" を削除しました。',
    );
    expect(GroupService.removeItemFromGroup).toHaveBeenLastCalledWith('昼食', '焼き そば');
    expectReply(
      await execute(['remove', '昼食', 'なし']),
      'グループ "昼食" またはアイテム "なし" は存在しません。',
    );
  });

  it('clearは入力不足、成功、対象なしを処理する', async () => {
    expectReply(await execute(['clear']), 'グループ名を指定してください。');
    vi.mocked(GroupService.clearGroupItems).mockReturnValueOnce(true).mockReturnValueOnce(false);
    expectReply(
      await execute(['clear', '昼食']),
      'グループ "昼食" のすべてのアイテムを削除しました。',
    );
    expectReply(await execute(['clear', 'なし']), 'グループ "なし" は存在しません。');
  });

  it('deleteのserviceエラーはラップせずそのまま伝播する', async () => {
    const error = new Error('delete failed');
    vi.mocked(GroupService.deleteGroup).mockImplementation(() => {
      throw error;
    });
    await expect(new GroupCommand().execute(createContext(['delete', '昼食']))).rejects.toBe(error);
  });

  it('itemsのserviceエラーはラップせずそのまま伝播する', async () => {
    const error = new Error('items failed');
    vi.mocked(GroupService.getItemsByGroupName).mockImplementation(() => {
      throw error;
    });

    await expect(new GroupCommand().execute(createContext(['items', '昼食']))).rejects.toBe(error);
  });

  it('removeのserviceエラーはラップせずそのまま伝播する', async () => {
    const error = new Error('remove failed');
    vi.mocked(GroupService.removeItemFromGroup).mockImplementation(() => {
      throw error;
    });

    await expect(
      new GroupCommand().execute(createContext(['remove', '昼食', 'ラーメン'])),
    ).rejects.toBe(error);
  });

  it('clearのserviceエラーはラップせずそのまま伝播する', async () => {
    const error = new Error('clear failed');
    vi.mocked(GroupService.clearGroupItems).mockImplementation(() => {
      throw error;
    });

    await expect(new GroupCommand().execute(createContext(['clear', '昼食']))).rejects.toBe(error);
  });
});
