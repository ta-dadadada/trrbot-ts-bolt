import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DefaultCommand } from './defaultCommand';
import { SayFunction, SlackEvent } from './types';
import { Logger } from '@slack/bolt';
import { WebClient } from '@slack/web-api';
import * as randomUtils from '../utils/random';

describe('DefaultCommand', () => {
  let command: DefaultCommand;
  let mockSay: SayFunction;
  let mockLogger: Logger;
  let mockEvent: SlackEvent;
  let mockClient: WebClient;

  beforeEach(() => {
    command = new DefaultCommand();
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
      text: 'default',
    } as SlackEvent;
    mockClient = {} as WebClient;

    vi.spyOn(randomUtils, 'getRandomItem').mockReturnValue('選択肢2');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('コマンドのプロパティが正しいこと', () => {
    expect(command.description).toBeDefined();
    expect(command.getExamples).toBeDefined();
    expect(command.getExamples('default')).toHaveLength(1);
  });

  it('argsから選択肢をランダムに選ぶこと', async () => {
    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['選択肢1', '選択肢2', '選択肢3'],
      client: mockClient,
    });

    expect(randomUtils.getRandomItem).toHaveBeenCalledWith(['選択肢1', '選択肢2', '選択肢3']);
    expect(mockSay).toHaveBeenCalledWith({
      text: '選ばれたのは: *選択肢2*',
      thread_ts: '1234567890.123456',
    });
  });

  it('空入力の場合にhelpメッセージを表示すること', async () => {
    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: [],
      client: mockClient,
    });

    expect(randomUtils.getRandomItem).not.toHaveBeenCalled();
    expect(mockSay).toHaveBeenCalledWith({
      text: `'help'コマンドでヘルプを表示できます。`,
      thread_ts: '1234567890.123456',
    });
  });

  it('スレッド内での返信が正しく動作すること', async () => {
    const threadEvent = {
      ...mockEvent,
      thread_ts: '123456789.123456',
    };

    await command.execute({
      event: threadEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['A', 'B'],
      client: mockClient,
    });

    expect(mockSay).toHaveBeenCalledWith({
      text: '選ばれたのは: *選択肢2*',
      thread_ts: '123456789.123456',
    });
  });
});
