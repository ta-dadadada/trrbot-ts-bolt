import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DiceCommand } from './diceCommand';
import { SayFunction, SlackEvent } from './types';
import { Logger } from '@slack/bolt';
import { WebClient } from '@slack/web-api';
import * as randomUtils from '../utils/random';

describe('DiceCommand', () => {
  let command: DiceCommand;
  let mockSay: SayFunction;
  let mockLogger: Logger;
  let mockEvent: SlackEvent;
  let mockClient: WebClient;

  beforeEach(() => {
    command = new DiceCommand();
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
      text: 'dice',
    } as SlackEvent;
    mockClient = {} as WebClient;

    // getRandomIntのモック
    vi.spyOn(randomUtils, 'getRandomInt').mockImplementation((_min, _max) => {
      // テスト用に固定値を返す
      return 4;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have correct properties', () => {
    expect(command.description).toBeDefined();
    expect(command.getExamples).toBeDefined();
    expect(command.getExamples('dice')).toHaveLength(4);
  });

  it('should return a random number between 1 and 6 when no arguments are provided', async () => {
    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: [],
      invokedName: 'dice',
      client: mockClient,
    });

    expect(randomUtils.getRandomInt).toHaveBeenCalledWith(1, 6);
    expect(mockSay).toHaveBeenCalledWith({
      text: '🎲 結果: *4*',
    });
  });

  it('解析済みの呼び出し名がダイス記法の場合は複数ダイスを処理する', async () => {
    await command.execute({
      event: {
        ...mockEvent,
        text: '<@UBOT> 2d6',
      },
      say: mockSay,
      logger: mockLogger,
      args: [],
      invokedName: '2d6',
      client: mockClient,
    });

    expect(randomUtils.getRandomInt).toHaveBeenCalledTimes(2);
    expect(randomUtils.getRandomInt).toHaveBeenCalledWith(1, 6);
    expect(mockSay).toHaveBeenCalledWith({
      text: '🎲 2d6 の結果: 4, 4 = *8*',
    });
  });

  it('should return a random number between 1 and the specified number', async () => {
    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['10'],
      invokedName: 'dice',
      client: mockClient,
    });

    expect(randomUtils.getRandomInt).toHaveBeenCalledWith(1, 10);
    expect(mockSay).toHaveBeenCalledWith({
      text: '🎲 結果: *4*',
    });
  });

  it('should handle invalid input', async () => {
    await expect(
      command.execute({
        event: mockEvent,
        say: mockSay,
        logger: mockLogger,
        args: ['invalid'],
        invokedName: 'dice',
        client: mockClient,
      }),
    ).rejects.toMatchObject({
      userMessage: '有効な正の整数を指定してください。',
    });

    expect(randomUtils.getRandomInt).not.toHaveBeenCalled();
    expect(mockSay).not.toHaveBeenCalled();
  });

  it('should handle negative numbers', async () => {
    await expect(
      command.execute({
        event: mockEvent,
        say: mockSay,
        logger: mockLogger,
        args: ['-5'],
        invokedName: 'dice',
        client: mockClient,
      }),
    ).rejects.toMatchObject({
      userMessage: '有効な正の整数を指定してください。',
    });

    expect(randomUtils.getRandomInt).not.toHaveBeenCalled();
    expect(mockSay).not.toHaveBeenCalled();
  });

  it('should handle thread replies', async () => {
    const threadEvent = {
      ...mockEvent,
      thread_ts: '123456789.123456',
    };

    await command.execute({
      event: threadEvent,
      say: mockSay,
      logger: mockLogger,
      args: [],
      invokedName: 'dice',
      client: mockClient,
    });

    expect(mockSay).toHaveBeenCalledWith({
      text: '🎲 結果: *4*',
      thread_ts: '123456789.123456',
    });
  });
});
