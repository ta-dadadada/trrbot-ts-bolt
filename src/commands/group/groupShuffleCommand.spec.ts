import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GroupShuffleCommand } from './groupShuffleCommand';
import { SayFunction, SlackEvent } from '../types';
import { Logger } from '@slack/bolt';
import { WebClient } from '@slack/web-api';
import type { IGroupService } from '../../features/group';
import * as randomUtils from '../../utils/random';

describe('GroupShuffleCommand', () => {
  let command: GroupShuffleCommand;
  let mockGroupService: IGroupService;
  let mockSay: SayFunction;
  let mockLogger: Logger;
  let mockEvent: SlackEvent;
  let mockClient: WebClient;

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

    command = new GroupShuffleCommand(mockGroupService);
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
      text: 'gshuffle',
    } as SlackEvent;
    mockClient = {} as WebClient;

    vi.spyOn(randomUtils, 'shuffleArray').mockImplementation((arr) => [...arr].reverse());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('コマンドのプロパティが正しいこと', () => {
    expect(command.description).toBeDefined();
    expect(command.getExamples).toBeDefined();
    expect(command.getExamples('gshuffle')).toHaveLength(1);
  });

  it('グループアイテムをシャッフルして順序付き表示すること', async () => {
    vi.mocked(mockGroupService.getItemsByGroupName).mockReturnValue([
      { id: 1, groupId: 1, itemText: 'A' },
      { id: 2, groupId: 1, itemText: 'B' },
      { id: 3, groupId: 1, itemText: 'C' },
    ]);

    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['テストグループ'],
      client: mockClient,
    });

    expect(mockGroupService.getItemsByGroupName).toHaveBeenCalledWith('テストグループ');
    expect(randomUtils.shuffleArray).toHaveBeenCalledWith(['A', 'B', 'C']);
    expect(mockSay).toHaveBeenCalledWith({
      text: 'グループ "テストグループ" のシャッフル結果:\n1. C\n2. B\n3. A',
      thread_ts: '1234567890.123456',
    });
  });

  it('グループ名が指定されていない場合にエラーメッセージを表示すること', async () => {
    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: [],
      client: mockClient,
    });

    expect(mockGroupService.getItemsByGroupName).not.toHaveBeenCalled();
    expect(mockSay).toHaveBeenCalledWith({
      text: 'グループ名を指定してください。',
      thread_ts: '1234567890.123456',
    });
  });

  it('存在しないグループの場合にエラーメッセージを表示すること', async () => {
    vi.mocked(mockGroupService.getItemsByGroupName).mockReturnValue([]);

    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['存在しないグループ'],
      client: mockClient,
    });

    expect(mockSay).toHaveBeenCalledWith({
      text: 'グループ "存在しないグループ" は存在しないか、アイテムがありません。',
      thread_ts: '1234567890.123456',
    });
  });

  it('アイテムが1つの場合に特別メッセージを表示すること', async () => {
    vi.mocked(mockGroupService.getItemsByGroupName).mockReturnValue([
      { id: 1, groupId: 1, itemText: '唯一のアイテム' },
    ]);

    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['テストグループ'],
      client: mockClient,
    });

    expect(randomUtils.shuffleArray).not.toHaveBeenCalled();
    expect(mockSay).toHaveBeenCalledWith({
      text: 'グループ "テストグループ" にはアイテムが1つしかありません: *唯一のアイテム*',
      thread_ts: '1234567890.123456',
    });
  });

  it('スレッド内での返信が正しく動作すること', async () => {
    const threadEvent = {
      ...mockEvent,
      thread_ts: '123456789.123456',
    };

    vi.mocked(mockGroupService.getItemsByGroupName).mockReturnValue([
      { id: 1, groupId: 1, itemText: 'A' },
      { id: 2, groupId: 1, itemText: 'B' },
    ]);

    await command.execute({
      event: threadEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['テストグループ'],
      client: mockClient,
    });

    expect(mockSay).toHaveBeenCalledWith({
      text: 'グループ "テストグループ" のシャッフル結果:\n1. B\n2. A',
      thread_ts: '123456789.123456',
    });
  });
});
