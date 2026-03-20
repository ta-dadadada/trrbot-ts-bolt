import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleList } from './listHandler';
import { handleCreate } from './createHandler';
import { handleDelete } from './deleteHandler';
import { handleItems } from './itemsHandler';
import { handleAdd } from './addHandler';
import { handleRemove } from './removeHandler';
import { handleClear } from './clearHandler';
import { GroupSubcommandContext } from './types';
import { SayFunction, SlackEvent } from '../types';
import { Logger } from '@slack/bolt';
import { WebClient } from '@slack/web-api';
import type { IGroupService } from '../../features/group';

describe('Group Handlers', () => {
  let mockGroupService: IGroupService;
  let mockSay: SayFunction;
  let mockLogger: Logger;
  let mockEvent: SlackEvent;
  let mockClient: WebClient;

  const createContext = (
    subcommandArgs: string[] = [],
    overrides: Partial<GroupSubcommandContext> = {},
  ): GroupSubcommandContext => ({
    event: mockEvent,
    say: mockSay,
    logger: mockLogger,
    args: [],
    client: mockClient,
    groupService: mockGroupService,
    subcommandArgs,
    replyOptions: { thread_ts: mockEvent.ts },
    ...overrides,
  });

  beforeEach(() => {
    mockGroupService = {
      getAllGroups: vi.fn(),
      getGroupByName: vi.fn(),
      createGroup: vi.fn(),
      deleteGroup: vi.fn(),
      getItemsByGroupName: vi.fn(),
      getRandomItemFromGroup: vi.fn(),
      getRandomItemFromGroupExcluding: vi.fn(),
      addItemToGroup: vi.fn(),
      addItemsToGroup: vi.fn(),
      removeItemFromGroup: vi.fn(),
      clearGroupItems: vi.fn(),
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
      text: 'group',
    } as SlackEvent;

    mockClient = {} as WebClient;

    vi.clearAllMocks();
  });

  describe('handleList', () => {
    it('グループ一覧を表示すること', async () => {
      vi.mocked(mockGroupService.getAllGroups).mockReturnValue([
        { id: 1, name: 'グループ1', createdAt: '', updatedAt: '' },
        { id: 2, name: 'グループ2', createdAt: '', updatedAt: '' },
      ]);

      await handleList(createContext());

      expect(mockSay).toHaveBeenCalledWith({
        text: expect.stringContaining('グループ一覧'),
        thread_ts: '1234567890.123456',
      });
      expect(mockSay).toHaveBeenCalledWith({
        text: expect.stringContaining('グループ1'),
        thread_ts: '1234567890.123456',
      });
    });

    it('グループが空の場合にメッセージを表示すること', async () => {
      vi.mocked(mockGroupService.getAllGroups).mockReturnValue([]);

      await handleList(createContext());

      expect(mockSay).toHaveBeenCalledWith({
        text: 'グループはありません。',
        thread_ts: '1234567890.123456',
      });
    });

    it('スレッド内で返信すること', async () => {
      const threadEvent = {
        ...mockEvent,
        thread_ts: '123456789.111111',
      };
      vi.mocked(mockGroupService.getAllGroups).mockReturnValue([]);

      await handleList(
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

  describe('handleCreate', () => {
    it('グループを作成すること', async () => {
      vi.mocked(mockGroupService.createGroup).mockReturnValue(1);

      await handleCreate(createContext(['テストグループ']));

      expect(mockGroupService.createGroup).toHaveBeenCalledWith('テストグループ');
      expect(mockSay).toHaveBeenCalledWith({
        text: 'グループ "テストグループ" を作成しました。',
        thread_ts: '1234567890.123456',
      });
    });

    it('グループ名がない場合にエラーメッセージを表示すること', async () => {
      await handleCreate(createContext([]));

      expect(mockGroupService.createGroup).not.toHaveBeenCalled();
      expect(mockSay).toHaveBeenCalledWith({
        text: 'グループ名を指定してください。',
        thread_ts: '1234567890.123456',
      });
    });
  });

  describe('handleDelete', () => {
    it('グループを削除すること', async () => {
      vi.mocked(mockGroupService.deleteGroup).mockReturnValue(true);

      await handleDelete(createContext(['テストグループ']));

      expect(mockGroupService.deleteGroup).toHaveBeenCalledWith('テストグループ');
      expect(mockSay).toHaveBeenCalledWith({
        text: 'グループ "テストグループ" を削除しました。',
        thread_ts: '1234567890.123456',
      });
    });

    it('存在しないグループの場合にエラーメッセージを表示すること', async () => {
      vi.mocked(mockGroupService.deleteGroup).mockReturnValue(false);

      await handleDelete(createContext(['存在しないグループ']));

      expect(mockSay).toHaveBeenCalledWith({
        text: 'グループ "存在しないグループ" は存在しません。',
        thread_ts: '1234567890.123456',
      });
    });

    it('グループ名がない場合にエラーメッセージを表示すること', async () => {
      await handleDelete(createContext([]));

      expect(mockGroupService.deleteGroup).not.toHaveBeenCalled();
      expect(mockSay).toHaveBeenCalledWith({
        text: 'グループ名を指定してください。',
        thread_ts: '1234567890.123456',
      });
    });
  });

  describe('handleItems', () => {
    it('グループのアイテム一覧を表示すること', async () => {
      vi.mocked(mockGroupService.getItemsByGroupName).mockReturnValue([
        { id: 1, groupId: 1, itemText: 'アイテム1', createdAt: '' },
        { id: 2, groupId: 1, itemText: 'アイテム2', createdAt: '' },
      ]);

      await handleItems(createContext(['テストグループ']));

      expect(mockSay).toHaveBeenCalledWith({
        text: expect.stringContaining('アイテム1'),
        thread_ts: '1234567890.123456',
      });
    });

    it('アイテムが空の場合にメッセージを表示すること', async () => {
      vi.mocked(mockGroupService.getItemsByGroupName).mockReturnValue([]);

      await handleItems(createContext(['テストグループ']));

      expect(mockSay).toHaveBeenCalledWith({
        text: 'グループ "テストグループ" にはアイテムがありません。',
        thread_ts: '1234567890.123456',
      });
    });

    it('グループ名がない場合にエラーメッセージを表示すること', async () => {
      await handleItems(createContext([]));

      expect(mockGroupService.getItemsByGroupName).not.toHaveBeenCalled();
      expect(mockSay).toHaveBeenCalledWith({
        text: 'グループ名を指定してください。',
        thread_ts: '1234567890.123456',
      });
    });
  });

  describe('handleAdd', () => {
    it('単一アイテムを追加すること', async () => {
      vi.mocked(mockGroupService.addItemToGroup).mockReturnValue(1);

      await handleAdd(createContext(['テストグループ', 'アイテム1']));

      expect(mockGroupService.addItemToGroup).toHaveBeenCalledWith('テストグループ', 'アイテム1');
      expect(mockSay).toHaveBeenCalledWith({
        text: 'グループ "テストグループ" にアイテム "アイテム1" を追加しました。',
        thread_ts: '1234567890.123456',
      });
    });

    it('複数アイテムを追加すること', async () => {
      vi.mocked(mockGroupService.addItemsToGroup).mockReturnValue([1, 2, 3]);

      await handleAdd(createContext(['テストグループ', 'アイテム1', 'アイテム2', 'アイテム3']));

      expect(mockGroupService.addItemsToGroup).toHaveBeenCalledWith('テストグループ', [
        'アイテム1',
        'アイテム2',
        'アイテム3',
      ]);
      expect(mockSay).toHaveBeenCalledWith({
        text: expect.stringContaining('3 個のアイテムを追加しました'),
        thread_ts: '1234567890.123456',
      });
    });

    it('存在しないグループの場合にエラーメッセージを表示すること', async () => {
      vi.mocked(mockGroupService.addItemToGroup).mockReturnValue(undefined);

      await handleAdd(createContext(['存在しないグループ', 'アイテム1']));

      expect(mockSay).toHaveBeenCalledWith({
        text: 'グループ "存在しないグループ" は存在しません。',
        thread_ts: '1234567890.123456',
      });
    });

    it('引数が足りない場合にエラーメッセージを表示すること', async () => {
      await handleAdd(createContext(['テストグループ']));

      expect(mockGroupService.addItemToGroup).not.toHaveBeenCalled();
      expect(mockSay).toHaveBeenCalledWith({
        text: expect.stringContaining('グループ名と1つ以上のアイテムを指定してください'),
        thread_ts: '1234567890.123456',
      });
    });
  });

  describe('handleRemove', () => {
    it('アイテムを削除すること', async () => {
      vi.mocked(mockGroupService.removeItemFromGroup).mockReturnValue(true);

      await handleRemove(createContext(['テストグループ', 'アイテム1']));

      expect(mockGroupService.removeItemFromGroup).toHaveBeenCalledWith(
        'テストグループ',
        'アイテム1',
      );
      expect(mockSay).toHaveBeenCalledWith({
        text: 'グループ "テストグループ" からアイテム "アイテム1" を削除しました。',
        thread_ts: '1234567890.123456',
      });
    });

    it('存在しないアイテムの場合にエラーメッセージを表示すること', async () => {
      vi.mocked(mockGroupService.removeItemFromGroup).mockReturnValue(false);

      await handleRemove(createContext(['テストグループ', '存在しないアイテム']));

      expect(mockSay).toHaveBeenCalledWith({
        text: expect.stringContaining('は存在しません'),
        thread_ts: '1234567890.123456',
      });
    });

    it('引数が足りない場合にエラーメッセージを表示すること', async () => {
      await handleRemove(createContext(['テストグループ']));

      expect(mockGroupService.removeItemFromGroup).not.toHaveBeenCalled();
      expect(mockSay).toHaveBeenCalledWith({
        text: 'グループ名とアイテムを指定してください。',
        thread_ts: '1234567890.123456',
      });
    });
  });

  describe('handleClear', () => {
    it('全アイテムを削除すること', async () => {
      vi.mocked(mockGroupService.clearGroupItems).mockReturnValue(true);

      await handleClear(createContext(['テストグループ']));

      expect(mockGroupService.clearGroupItems).toHaveBeenCalledWith('テストグループ');
      expect(mockSay).toHaveBeenCalledWith({
        text: 'グループ "テストグループ" のすべてのアイテムを削除しました。',
        thread_ts: '1234567890.123456',
      });
    });

    it('存在しないグループの場合にエラーメッセージを表示すること', async () => {
      vi.mocked(mockGroupService.clearGroupItems).mockReturnValue(false);

      await handleClear(createContext(['存在しないグループ']));

      expect(mockSay).toHaveBeenCalledWith({
        text: 'グループ "存在しないグループ" は存在しません。',
        thread_ts: '1234567890.123456',
      });
    });

    it('グループ名がない場合にエラーメッセージを表示すること', async () => {
      await handleClear(createContext([]));

      expect(mockGroupService.clearGroupItems).not.toHaveBeenCalled();
      expect(mockSay).toHaveBeenCalledWith({
        text: 'グループ名を指定してください。',
        thread_ts: '1234567890.123456',
      });
    });
  });
});
