import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '@slack/bolt';
import { WebClient } from '@slack/web-api';
import { GroupShuffleCommand } from './groupShuffleCommand';
import { SayFunction, SlackEvent } from './types';
import type { GroupOperations } from '../services/groupService';
import { GroupItem } from '../models/group';
import * as randomUtils from '../utils/random';

const groupService = {
  getAllGroups: vi.fn(),
  createGroup: vi.fn(),
  deleteGroup: vi.fn(),
  getItemsByGroupName: vi.fn(),
  getRandomItemFromGroup: vi.fn(),
  getRandomItemFromGroupExcluding: vi.fn(),
  addItemToGroup: vi.fn(),
  addItemsToGroup: vi.fn(),
  removeItemFromGroup: vi.fn(),
  clearGroupItems: vi.fn(),
} satisfies GroupOperations;

describe('GroupShuffleCommand', () => {
  let command: GroupShuffleCommand;
  let mockSay: SayFunction;
  let mockLogger: Logger;
  let mockEvent: SlackEvent;
  let mockClient: WebClient;

  beforeEach(() => {
    command = new GroupShuffleCommand(groupService);
    mockSay = vi.fn().mockResolvedValue({ ok: true, channel: 'C123', ts: '1.000' });
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
      user: 'U123',
      channel: 'C123',
      channel_type: 'channel',
      event_ts: '1.000',
      ts: '1.000',
      text: 'groupshuffle',
    } as SlackEvent;
    mockClient = {} as WebClient;
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('グループ名がない場合は不足メッセージを送信する', async () => {
    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: [],
      invokedName: 'groupshuffle',
      client: mockClient,
    });

    expect(groupService.getItemsByGroupName).not.toHaveBeenCalled();
    expect(mockSay).toHaveBeenCalledWith({ text: 'グループ名を指定してください。' });
  });

  it.each(['存在しないグループ', '空グループ'])(
    '%s が存在しないか空の場合は同じメッセージを送信する',
    async (groupName) => {
      groupService.getItemsByGroupName.mockReturnValue([]);

      await command.execute({
        event: mockEvent,
        say: mockSay,
        logger: mockLogger,
        args: [groupName],
        invokedName: 'groupshuffle',
        client: mockClient,
      });

      expect(groupService.getItemsByGroupName).toHaveBeenCalledWith(groupName);
      expect(mockSay).toHaveBeenCalledWith({
        text: `グループ "${groupName}" は存在しないか、アイテムがありません。`,
      });
    },
  );

  it('アイテムが1件の場合は特別なメッセージを送信する', async () => {
    groupService.getItemsByGroupName.mockReturnValue([item('唯一')]);

    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['テスト'],
      invokedName: 'groupshuffle',
      client: mockClient,
    });

    expect(mockSay).toHaveBeenCalledWith({
      text: 'グループ "テスト" にはアイテムが1つしかありません: *唯一*',
    });
  });

  it('GroupServiceのアイテムをシャッフルして番号付きで送信する', async () => {
    groupService.getItemsByGroupName.mockReturnValue([item('A'), item('B'), item('C')]);
    const shuffleArray = vi.spyOn(randomUtils, 'shuffleArray').mockReturnValue(['C', 'A', 'B']);

    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['テスト'],
      invokedName: 'groupshuffle',
      client: mockClient,
    });

    expect(groupService.getItemsByGroupName).toHaveBeenCalledWith('テスト');
    expect(shuffleArray).toHaveBeenCalledWith(['A', 'B', 'C']);
    expect(mockSay).toHaveBeenCalledWith({
      text: 'グループ "テスト" のシャッフル結果:\n1. C\n2. A\n3. B',
    });
  });

  it('既存スレッドへ返信する', async () => {
    groupService.getItemsByGroupName.mockReturnValue([item('A'), item('B')]);
    vi.spyOn(randomUtils, 'shuffleArray').mockReturnValue(['B', 'A']);

    await command.execute({
      event: { ...mockEvent, thread_ts: '0.999' },
      say: mockSay,
      logger: mockLogger,
      args: ['テスト'],
      invokedName: 'groupshuffle',
      client: mockClient,
    });

    expect(mockSay).toHaveBeenCalledWith({
      text: 'グループ "テスト" のシャッフル結果:\n1. B\n2. A',
      thread_ts: '0.999',
    });
  });
});

const item = (itemText: string): GroupItem => ({
  id: 1,
  groupId: 1,
  itemText,
  createdAt: '2026-01-01T00:00:00.000Z',
});
