import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ShuffleCommand } from './shuffleCommand';
import { SayFunction, SlackEvent } from './types';
import { Logger } from '@slack/bolt';
import { WebClient } from '@slack/web-api';
import * as randomUtils from '../utils/random';
import { BOT_MENTION_NAME } from '../config/constants';

describe('ShuffleCommand', () => {
  let command: ShuffleCommand;
  let mockSay: SayFunction;
  let mockLogger: Logger;
  let mockEvent: SlackEvent;
  let mockClient: WebClient;

  beforeEach(() => {
    command = new ShuffleCommand();
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
      text: 'shuffle',
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
    expect(command.getExamples('shuffle')).toHaveLength(2);
  });

  it('引数をシャッフルして順序付き表示すること', async () => {
    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['A', 'B', 'C', 'D'],
      client: mockClient,
    });

    expect(randomUtils.shuffleArray).toHaveBeenCalledWith(['A', 'B', 'C', 'D']);
    expect(mockSay).toHaveBeenCalledWith({
      text: 'シャッフル結果:\n1. D\n2. C\n3. B\n4. A',
      thread_ts: '1234567890.123456',
    });
  });

  it('引数が1つ以下の場合にエラーメッセージを表示すること', async () => {
    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['A'],
      client: mockClient,
    });

    const expectedText = `並び替える項目を2つ以上指定してください。\n例: \`${BOT_MENTION_NAME} shuffle A B C D\``;

    expect(randomUtils.shuffleArray).not.toHaveBeenCalled();
    expect(mockSay).toHaveBeenCalledWith({
      text: expectedText,
      thread_ts: '1234567890.123456',
    });
  });

  it('引数がない場合にエラーメッセージを表示すること', async () => {
    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: [],
      client: mockClient,
    });

    const expectedText = `並び替える項目を2つ以上指定してください。\n例: \`${BOT_MENTION_NAME} shuffle A B C D\``;

    expect(randomUtils.shuffleArray).not.toHaveBeenCalled();
    expect(mockSay).toHaveBeenCalledWith({
      text: expectedText,
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
      args: ['A', 'B', 'C'],
      client: mockClient,
    });

    expect(mockSay).toHaveBeenCalledWith({
      text: 'シャッフル結果:\n1. C\n2. B\n3. A',
      thread_ts: '123456789.123456',
    });
  });
});
