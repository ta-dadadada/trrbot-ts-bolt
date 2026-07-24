import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { App, Logger } from '@slack/bolt';
import type { WebClient } from '@slack/web-api';
import { createCommandRouter, type ProcessCommand, type ResolveCommand } from '../commands/router';
import type { Command, SayFunction, SlackEvent } from '../commands/types';

vi.mock('../utils/errorHandler', () => ({
  handleCommandError: vi.fn(),
  logCommandSuccess: vi.fn(),
}));

import { handleCommandError, logCommandSuccess } from '../utils/errorHandler';
import { registerMentionHandlers } from './mentionHandler';

const createCommand = (execute = vi.fn().mockResolvedValue(undefined)): Command => ({
  description: 'test',
  getExamples: vi.fn().mockReturnValue([]),
  execute,
});

const createLogger = (): Logger =>
  ({
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    setLevel: vi.fn(),
    getLevel: vi.fn(),
    setName: vi.fn(),
  }) as unknown as Logger;

const createEvent = (overrides: Partial<SlackEvent> = {}): SlackEvent =>
  ({
    type: 'message',
    user: 'U123',
    channel: 'C123',
    channel_type: 'channel',
    event_ts: '100.000',
    ts: '100.000',
    text: 'choice a b',
    ...overrides,
  }) as SlackEvent;

describe('createCommandRouter', () => {
  let resolveCommand: ReturnType<typeof vi.fn<ResolveCommand>>;
  let processCommand: ProcessCommand;
  let say: SayFunction;
  let logger: Logger;
  let client: WebClient;

  beforeEach(() => {
    vi.clearAllMocks();
    resolveCommand = vi.fn<ResolveCommand>();
    processCommand = createCommandRouter(resolveCommand);
    say = vi.fn().mockResolvedValue({ ok: true });
    logger = createLogger();
    client = {} as WebClient;
  });

  it('コマンド名と引数を解析してコマンドを実行する', async () => {
    const command = createCommand();
    resolveCommand.mockReturnValue({ command, invokedName: 'choice' });
    const event = createEvent();

    await processCommand('choice a b', event, say, logger, client);

    expect(resolveCommand).toHaveBeenCalledWith('choice');
    expect(command.execute).toHaveBeenCalledWith({
      event,
      say,
      logger,
      args: ['a', 'b'],
      invokedName: 'choice',
      client,
    });
    expect(logCommandSuccess).toHaveBeenCalledWith(
      logger,
      'choice',
      expect.objectContaining({
        user: 'U123',
        channel: 'C123',
        channelType: 'channel',
      }),
    );
  });

  it('空文字列は空のコマンド名として解決する', async () => {
    const command = createCommand();
    resolveCommand.mockReturnValue({ command, invokedName: '' });

    await processCommand('', createEvent(), say, logger, client);

    expect(resolveCommand).toHaveBeenCalledWith('');
    expect(command.execute).toHaveBeenCalled();
  });

  it('DM専用コマンドをチャンネルでは拒否する', async () => {
    const command = createCommand();
    resolveCommand.mockReturnValue({
      command,
      invokedName: 'secret',
      registration: {
        command,
        primaryName: 'secret',
        aliases: [],
        dmOnly: true,
      },
    });

    await processCommand('secret 10', createEvent(), say, logger, client);

    expect(command.execute).not.toHaveBeenCalled();
    expect(say).toHaveBeenCalledWith({
      text: 'このコマンドはDM専用です。DMで実行してください。',
    });
  });

  it('DM専用コマンドをDMでは実行する', async () => {
    const command = createCommand();
    resolveCommand.mockReturnValue({
      command,
      invokedName: 'secret',
      registration: {
        command,
        primaryName: 'secret',
        aliases: [],
        dmOnly: true,
      },
    });

    await processCommand(
      'secret 10',
      createEvent({ channel: 'D123', channel_type: 'im' }),
      say,
      logger,
      client,
    );

    expect(command.execute).toHaveBeenCalled();
  });

  it('コマンド例外を共通エラーハンドラへ渡す', async () => {
    const error = new Error('boom');
    const command = createCommand(vi.fn().mockRejectedValue(error));
    resolveCommand.mockReturnValue({ command, invokedName: 'choice' });

    await processCommand('choice a b', createEvent(), say, logger, client);

    expect(handleCommandError).toHaveBeenCalledWith(error, expect.anything(), 'choice');
    expect(logCommandSuccess).not.toHaveBeenCalled();
  });
});

describe('registerMentionHandlers', () => {
  it.each([
    ['C123', 'channel'],
    ['D123', 'im'],
    ['G123', 'group'],
    ['X123', 'channel'],
  ] as const)('チャンネルID %s を %s として正規化する', async (channel, channelType) => {
    const processCommand = vi.fn<ProcessCommand>();
    let listener: ((args: Record<string, unknown>) => Promise<void>) | undefined;
    const app = {
      event: vi.fn((_name: string, callback: (args: Record<string, unknown>) => Promise<void>) => {
        listener = callback;
      }),
    } as unknown as App;
    const say = vi.fn().mockResolvedValue({ ok: true });
    const logger = createLogger();
    const client = {} as WebClient;

    registerMentionHandlers(app, { processCommand });
    await listener?.({
      event: {
        type: 'app_mention',
        user: 'U123',
        channel,
        event_ts: '100.000',
        ts: '100.000',
        text: '<@UBOT> choice a b',
      },
      say,
      logger,
      client,
    });

    expect(processCommand).toHaveBeenCalledWith(
      'choice a b',
      expect.objectContaining({
        channel,
        channel_type: channelType,
        text: '<@UBOT> choice a b',
      }),
      say,
      logger,
      client,
    );
  });
});
