import { describe, it, expect, beforeEach, vi } from 'vitest';
import { processCommand } from './mentionHandler';
import { SayFunction, SlackEvent, Command } from '../commands/types';
import { Logger } from '@slack/bolt';
import { WebClient } from '@slack/web-api';

const createMockCommand = (overrides: Partial<Command> = {}): Command => ({
  description: '',
  getExamples: vi.fn().mockReturnValue([]),
  execute: vi.fn(),
  ...overrides,
});

// Mock the commands module
vi.mock('../commands', () => ({
  getCommand: vi.fn().mockReturnValue({
    description: '',
    getExamples: vi.fn().mockReturnValue([]),
    execute: vi.fn(),
  }),
  getCommandRegistration: vi.fn().mockReturnValue(undefined),
}));

vi.mock('../utils/errorHandler', () => ({
  handleCommandError: vi.fn(),
}));

import { getCommand, getCommandRegistration } from '../commands';
import { handleCommandError } from '../utils/errorHandler';

describe('mentionHandler - processCommand', () => {
  let mockSay: SayFunction;
  let mockLogger: Logger;
  let mockEvent: SlackEvent;
  let mockClient: WebClient;

  beforeEach(() => {
    vi.clearAllMocks();

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
    } as unknown as Logger;

    mockEvent = {
      type: 'message',
      user: 'U123456',
      channel: 'C123456',
      channel_type: 'channel',
      event_ts: '1234567890.123456',
      ts: '1234567890.123456',
      text: 'test message',
    } as SlackEvent;

    mockClient = {} as WebClient;
  });

  it('空テキストの場合はgetCommand("")で解決したコマンドが実行される', async () => {
    const mockCmd = createMockCommand();
    vi.mocked(getCommand).mockReturnValue(mockCmd);

    await processCommand('', mockEvent, mockSay, mockLogger, mockClient);

    expect(getCommand).toHaveBeenCalledWith('');
    expect(mockCmd.execute).toHaveBeenCalled();
  });

  it('コマンドを解決して実行する', async () => {
    const mockCmd = createMockCommand();
    vi.mocked(getCommand).mockReturnValue(mockCmd);

    await processCommand('choice a b c', mockEvent, mockSay, mockLogger, mockClient);

    expect(getCommand).toHaveBeenCalledWith('choice');
    expect(mockCmd.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        args: ['a', 'b', 'c'],
        event: mockEvent,
        say: mockSay,
      }),
    );
  });

  it('DM専用コマンドをチャンネルで実行するとエラーメッセージを返す', async () => {
    vi.mocked(getCommandRegistration).mockReturnValue({
      command: createMockCommand(),
      primaryName: 'secret',
      aliases: [],
      dmOnly: true,
    });

    await processCommand('secret test', mockEvent, mockSay, mockLogger, mockClient);

    expect(mockSay).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'このコマンドはDM専用です。DMで実行してください。' }),
    );
  });

  it('DM専用コマンドをDMで実行すると正常に動作する', async () => {
    const mockCmd = createMockCommand();
    vi.mocked(getCommand).mockReturnValue(mockCmd);
    vi.mocked(getCommandRegistration).mockReturnValue({
      command: mockCmd,
      primaryName: 'secret',
      aliases: [],
      dmOnly: true,
    });

    const dmEvent = { ...mockEvent, channel_type: 'im' as const } as SlackEvent;
    await processCommand('secret test', dmEvent, mockSay, mockLogger, mockClient);

    expect(mockCmd.execute).toHaveBeenCalled();
  });

  it('コマンド実行中のエラーはhandleCommandErrorで処理される', async () => {
    const error = new Error('test error');
    const mockCmd = createMockCommand({ execute: vi.fn().mockRejectedValue(error) });
    vi.mocked(getCommand).mockReturnValue(mockCmd);
    vi.mocked(getCommandRegistration).mockReturnValue(undefined);

    await processCommand('choice a b', mockEvent, mockSay, mockLogger, mockClient);

    expect(handleCommandError).toHaveBeenCalledWith(error, expect.anything(), 'mentionHandler');
  });
});
