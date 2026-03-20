import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SecretCommand } from './secretCommand';
import { SayFunction, SlackEvent } from './types';
import { Logger } from '@slack/bolt';
import { WebClient } from '@slack/web-api';
import * as randomUtils from '../utils/random';

describe('SecretCommand', () => {
  let command: SecretCommand;
  let mockSay: SayFunction;
  let mockLogger: Logger;
  let mockEvent: SlackEvent;
  let mockClient: WebClient;

  beforeEach(() => {
    command = new SecretCommand();
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
      text: 'secret',
    } as SlackEvent;
    mockClient = {} as WebClient;

    vi.spyOn(randomUtils, 'getRandomStringWithSymbols').mockReturnValue('Ab1@Cd2#Ef');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('コマンドのプロパティが正しいこと', () => {
    expect(command.description).toBeDefined();
    expect(command.getExamples).toBeDefined();
    expect(command.getExamples('secret')).toHaveLength(2);
  });

  it('デフォルトで10文字の文字列を生成すること', async () => {
    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: [],
      client: mockClient,
    });

    expect(randomUtils.getRandomStringWithSymbols).toHaveBeenCalledWith(10);
    expect(mockSay).toHaveBeenCalledWith({
      text: '🔐 生成されたシークレット文字列（記号含む）: `Ab1@Cd2#Ef`',
      thread_ts: '1234567890.123456',
    });
  });

  it('指定された長さで文字列を生成すること', async () => {
    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['20'],
      client: mockClient,
    });

    expect(randomUtils.getRandomStringWithSymbols).toHaveBeenCalledWith(20);
  });

  it('100を超える長さは100にクランプされること', async () => {
    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['200'],
      client: mockClient,
    });

    expect(randomUtils.getRandomStringWithSymbols).toHaveBeenCalledWith(100);
  });

  it('無効な入力の場合にエラーメッセージを表示すること', async () => {
    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['invalid'],
      client: mockClient,
    });

    expect(randomUtils.getRandomStringWithSymbols).not.toHaveBeenCalled();
    expect(mockSay).toHaveBeenCalledWith({
      text: '有効な正の整数を指定してください。',
      thread_ts: '1234567890.123456',
    });
  });

  it('負数の場合にエラーメッセージを表示すること', async () => {
    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['-5'],
      client: mockClient,
    });

    expect(randomUtils.getRandomStringWithSymbols).not.toHaveBeenCalled();
    expect(mockSay).toHaveBeenCalledWith({
      text: '有効な正の整数を指定してください。',
      thread_ts: '1234567890.123456',
    });
  });

  it('生成エラーの場合にエラーメッセージを表示すること', async () => {
    vi.mocked(randomUtils.getRandomStringWithSymbols).mockImplementation(() => {
      throw new Error('generation error');
    });

    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: [],
      client: mockClient,
    });

    expect(mockLogger.error).toHaveBeenCalled();
    expect(mockSay).toHaveBeenCalledWith({
      text: 'ランダム文字列の生成中にエラーが発生しました。',
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
      args: [],
      client: mockClient,
    });

    expect(mockSay).toHaveBeenCalledWith({
      text: '🔐 生成されたシークレット文字列（記号含む）: `Ab1@Cd2#Ef`',
      thread_ts: '123456789.123456',
    });
  });
});
