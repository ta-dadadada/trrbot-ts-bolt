import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GroupChoiceCommand } from './groupChoiceCommand';
import { SayFunction, SlackEvent } from './types';
import { Logger } from '@slack/bolt';
import { WebClient } from '@slack/web-api';
import type { GroupOperations } from '../services/groupService';

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

describe('GroupChoiceCommand', () => {
  let command: GroupChoiceCommand;
  let mockSay: SayFunction;
  let mockLogger: Logger;
  let mockEvent: SlackEvent;
  let mockClient: WebClient;

  beforeEach(() => {
    command = new GroupChoiceCommand(groupService);
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
      text: 'groupchoice',
    } as SlackEvent;
    mockClient = {} as WebClient;

    // モックをリセット
    vi.clearAllMocks();
  });

  it('コマンドのプロパティが正しいこと', () => {
    expect(command.description).toBeDefined();
    expect(command.getExamples).toBeDefined();
    expect(command.getExamples('gc')).toHaveLength(2);
  });

  it('引数がない場合にエラーメッセージを表示すること', async () => {
    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: [],
      invokedName: 'groupchoice',
      client: mockClient,
    });

    expect(groupService.getRandomItemFromGroup).not.toHaveBeenCalled();
    expect(groupService.getRandomItemFromGroupExcluding).not.toHaveBeenCalled();
    expect(mockSay).toHaveBeenCalledWith({
      text: 'グループ名を指定してください。',
    });
  });

  it('存在しないグループ名を指定した場合にエラーメッセージを表示すること', async () => {
    // getRandomItemFromGroupがundefinedを返すようにモック
    groupService.getRandomItemFromGroup.mockReturnValue(undefined);

    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['存在しないグループ'],
      invokedName: 'groupchoice',
      client: mockClient,
    });

    expect(groupService.getRandomItemFromGroup).toHaveBeenCalledWith('存在しないグループ');
    expect(mockSay).toHaveBeenCalledWith({
      text: 'グループ "存在しないグループ" は存在しないか、アイテムがありません。',
    });
  });

  it('通常のグループ選択（除外なし）が正しく動作すること', async () => {
    // getRandomItemFromGroupが値を返すようにモック
    groupService.getRandomItemFromGroup.mockReturnValue('選択されたアイテム');

    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['テストグループ'],
      invokedName: 'groupchoice',
      client: mockClient,
    });

    expect(groupService.getRandomItemFromGroup).toHaveBeenCalledWith('テストグループ');
    expect(groupService.getRandomItemFromGroupExcluding).not.toHaveBeenCalled();
    expect(mockSay).toHaveBeenCalledWith({
      text: '選ばれたのは: *選択されたアイテム*',
    });
  });

  it('除外アイテムを指定した場合に正しく動作すること', async () => {
    // getRandomItemFromGroupExcludingが値を返すようにモック
    groupService.getRandomItemFromGroupExcluding.mockReturnValue('除外後に選択されたアイテム');

    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['テストグループ', '-', '除外アイテム1', '除外アイテム2'],
      invokedName: 'groupchoice',
      client: mockClient,
    });

    expect(groupService.getRandomItemFromGroup).not.toHaveBeenCalled();
    expect(groupService.getRandomItemFromGroupExcluding).toHaveBeenCalledWith('テストグループ', [
      '除外アイテム1',
      '除外アイテム2',
    ]);
    expect(mockSay).toHaveBeenCalledWith({
      text: '選ばれたのは: *除外後に選択されたアイテム*',
    });
  });

  it('除外アイテムを指定したが結果がない場合にエラーメッセージを表示すること', async () => {
    // getRandomItemFromGroupExcludingがundefinedを返すようにモック
    groupService.getRandomItemFromGroupExcluding.mockReturnValue(undefined);

    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['テストグループ', '-', '除外アイテム1', '除外アイテム2'],
      invokedName: 'groupchoice',
      client: mockClient,
    });

    expect(groupService.getRandomItemFromGroupExcluding).toHaveBeenCalledWith('テストグループ', [
      '除外アイテム1',
      '除外アイテム2',
    ]);
    expect(mockSay).toHaveBeenCalledWith({
      text: 'グループ "テストグループ" は存在しないか、アイテムがありません。',
    });
  });

  it('スレッド内での返信が正しく動作すること', async () => {
    const threadEvent = {
      ...mockEvent,
      thread_ts: '123456789.123456',
    };

    // getRandomItemFromGroupが値を返すようにモック
    groupService.getRandomItemFromGroup.mockReturnValue('選択されたアイテム');

    await command.execute({
      event: threadEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['テストグループ'],
      invokedName: 'groupchoice',
      client: mockClient,
    });

    expect(groupService.getRandomItemFromGroup).toHaveBeenCalledWith('テストグループ');
    expect(mockSay).toHaveBeenCalledWith({
      text: '選ばれたのは: *選択されたアイテム*',
      thread_ts: '123456789.123456',
    });
  });

  it('グループ名に複数の単語を含む場合も正しく動作すること', async () => {
    // getRandomItemFromGroupが値を返すようにモック
    groupService.getRandomItemFromGroup.mockReturnValue('選択されたアイテム');

    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['複数', '単語', 'グループ'],
      invokedName: 'groupchoice',
      client: mockClient,
    });

    expect(groupService.getRandomItemFromGroup).toHaveBeenCalledWith('複数 単語 グループ');
    expect(mockSay).toHaveBeenCalledWith({
      text: '選ばれたのは: *選択されたアイテム*',
    });
  });

  it('グループ名に複数の単語を含み、除外アイテムを指定した場合も正しく動作すること', async () => {
    // getRandomItemFromGroupExcludingが値を返すようにモック
    groupService.getRandomItemFromGroupExcluding.mockReturnValue('除外後に選択されたアイテム');

    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['複数', '単語', 'グループ', '-', '除外アイテム1', '除外アイテム2'],
      invokedName: 'groupchoice',
      client: mockClient,
    });

    expect(groupService.getRandomItemFromGroupExcluding).toHaveBeenCalledWith(
      '複数 単語 グループ',
      ['除外アイテム1', '除外アイテム2'],
    );
    expect(mockSay).toHaveBeenCalledWith({
      text: '選ばれたのは: *除外後に選択されたアイテム*',
    });
  });
});
