import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GroupChoiceCommand } from './groupChoiceCommand';
import { SayFunction, SlackEvent } from '../types';
import { Logger } from '@slack/bolt';
import { WebClient } from '@slack/web-api';
import type { IGroupService } from '../../features/group';

describe('GroupChoiceCommand', () => {
  let command: GroupChoiceCommand;
  let mockGroupService: IGroupService;
  let mockSay: SayFunction;
  let mockLogger: Logger;
  let mockEvent: SlackEvent;
  let mockClient: WebClient;

  beforeEach(() => {
    // モックサービスを作成
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

    command = new GroupChoiceCommand(mockGroupService);
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
      client: mockClient,
    });

    expect(mockGroupService.getRandomItemFromGroup).not.toHaveBeenCalled();
    expect(mockGroupService.getRandomItemFromGroupExcluding).not.toHaveBeenCalled();
    expect(mockSay).toHaveBeenCalledWith({
      text: 'グループ名を指定してください。',
      thread_ts: '1234567890.123456',
    });
  });

  it('存在しないグループ名を指定した場合にエラーメッセージを表示すること', async () => {
    vi.mocked(mockGroupService.getRandomItemFromGroup).mockReturnValue(undefined);

    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['存在しないグループ'],
      client: mockClient,
    });

    expect(mockGroupService.getRandomItemFromGroup).toHaveBeenCalledWith('存在しないグループ');
    expect(mockSay).toHaveBeenCalledWith({
      text: 'グループ "存在しないグループ" は存在しないか、アイテムがありません。',
      thread_ts: '1234567890.123456',
    });
  });

  it('通常のグループ選択（除外なし）が正しく動作すること', async () => {
    vi.mocked(mockGroupService.getRandomItemFromGroup).mockReturnValue('選択されたアイテム');

    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['テストグループ'],
      client: mockClient,
    });

    expect(mockGroupService.getRandomItemFromGroup).toHaveBeenCalledWith('テストグループ');
    expect(mockGroupService.getRandomItemFromGroupExcluding).not.toHaveBeenCalled();
    expect(mockSay).toHaveBeenCalledWith({
      text: '選ばれたのは: *選択されたアイテム*',
      thread_ts: '1234567890.123456',
    });
  });

  it('除外アイテムを指定した場合に正しく動作すること', async () => {
    vi.mocked(mockGroupService.getRandomItemFromGroupExcluding).mockReturnValue(
      '除外後に選択されたアイテム',
    );

    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['テストグループ', '-', '除外アイテム1', '除外アイテム2'],
      client: mockClient,
    });

    expect(mockGroupService.getRandomItemFromGroup).not.toHaveBeenCalled();
    expect(mockGroupService.getRandomItemFromGroupExcluding).toHaveBeenCalledWith(
      'テストグループ',
      ['除外アイテム1', '除外アイテム2'],
    );
    expect(mockSay).toHaveBeenCalledWith({
      text: '選ばれたのは: *除外後に選択されたアイテム*',
      thread_ts: '1234567890.123456',
    });
  });

  it('除外アイテムを指定したが結果がない場合にエラーメッセージを表示すること', async () => {
    vi.mocked(mockGroupService.getRandomItemFromGroupExcluding).mockReturnValue(undefined);

    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['テストグループ', '-', '除外アイテム1', '除外アイテム2'],
      client: mockClient,
    });

    expect(mockGroupService.getRandomItemFromGroupExcluding).toHaveBeenCalledWith(
      'テストグループ',
      ['除外アイテム1', '除外アイテム2'],
    );
    expect(mockSay).toHaveBeenCalledWith({
      text: 'グループ "テストグループ" は存在しないか、アイテムがありません。',
      thread_ts: '1234567890.123456',
    });
  });

  it('スレッド内での返信が正しく動作すること', async () => {
    const threadEvent = {
      ...mockEvent,
      thread_ts: '123456789.123456',
    };

    vi.mocked(mockGroupService.getRandomItemFromGroup).mockReturnValue('選択されたアイテム');

    await command.execute({
      event: threadEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['テストグループ'],
      client: mockClient,
    });

    expect(mockGroupService.getRandomItemFromGroup).toHaveBeenCalledWith('テストグループ');
    expect(mockSay).toHaveBeenCalledWith({
      text: '選ばれたのは: *選択されたアイテム*',
      thread_ts: '123456789.123456',
    });
  });

  it('グループ名に複数の単語を含む場合も正しく動作すること', async () => {
    vi.mocked(mockGroupService.getRandomItemFromGroup).mockReturnValue('選択されたアイテム');

    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['複数', '単語', 'グループ'],
      client: mockClient,
    });

    expect(mockGroupService.getRandomItemFromGroup).toHaveBeenCalledWith('複数 単語 グループ');
    expect(mockSay).toHaveBeenCalledWith({
      text: '選ばれたのは: *選択されたアイテム*',
      thread_ts: '1234567890.123456',
    });
  });

  it('グループ名に複数の単語を含み、除外アイテムを指定した場合も正しく動作すること', async () => {
    vi.mocked(mockGroupService.getRandomItemFromGroupExcluding).mockReturnValue(
      '除外後に選択されたアイテム',
    );

    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['複数', '単語', 'グループ', '-', '除外アイテム1', '除外アイテム2'],
      client: mockClient,
    });

    expect(mockGroupService.getRandomItemFromGroupExcluding).toHaveBeenCalledWith(
      '複数 単語 グループ',
      ['除外アイテム1', '除外アイテム2'],
    );
    expect(mockSay).toHaveBeenCalledWith({
      text: '選ばれたのは: *除外後に選択されたアイテム*',
      thread_ts: '1234567890.123456',
    });
  });
});
