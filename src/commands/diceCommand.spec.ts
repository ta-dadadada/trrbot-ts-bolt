import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DiceCommand } from './diceCommand';
import { SayFunction } from './types';
import { Logger } from '@slack/bolt';
import { WebClient } from '@slack/web-api';
import * as randomUtils from '../utils/random';

describe('DiceCommand', () => {
  let command: DiceCommand;
  let mockSay: SayFunction;
  let mockLogger: Logger;
  let mockEvent: { ts: string; thread_ts?: string };
  let mockClient: WebClient;

  beforeEach(() => {
    command = new DiceCommand();
    mockSay = vi.fn().mockResolvedValue({});
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
      ts: '123456789.123456',
    };
    mockClient = {} as WebClient;

    // getRandomIntのモック
    vi.spyOn(randomUtils, 'getRandomInt').mockImplementation((_min, _max) => {
      // テスト用に固定値を返す
      return 4;
    });
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
      client: mockClient,
    });

    expect(randomUtils.getRandomInt).toHaveBeenCalledWith(1, 6);
    expect(mockSay).toHaveBeenCalledWith({
      text: '🎲 結果: *4*',
    });
  });

  it('should return a random number between 1 and the specified number', async () => {
    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['10'],
      client: mockClient,
    });

    expect(randomUtils.getRandomInt).toHaveBeenCalledWith(1, 10);
    expect(mockSay).toHaveBeenCalledWith({
      text: '🎲 結果: *4*',
    });
  });

  it('should handle invalid input', async () => {
    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['invalid'],
      client: mockClient,
    });

    expect(randomUtils.getRandomInt).not.toHaveBeenCalled();
    expect(mockSay).toHaveBeenCalledWith({
      text: '有効な正の整数を指定してください。',
    });
  });

  it('should handle negative numbers', async () => {
    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['-5'],
      client: mockClient,
    });

    expect(randomUtils.getRandomInt).not.toHaveBeenCalled();
    expect(mockSay).toHaveBeenCalledWith({
      text: '有効な正の整数を指定してください。',
    });
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
      client: mockClient,
    });

    expect(mockSay).toHaveBeenCalledWith({
      text: '🎲 結果: *4*',
      thread_ts: '123456789.123456',
    });
  });
});
