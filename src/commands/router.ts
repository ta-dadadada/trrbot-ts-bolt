import type { Logger, AllMiddlewareArgs } from '@slack/bolt';
import { handleCommandError, logCommandSuccess } from '../utils/errorHandler';
import { parseCommand } from '../utils/random';
import { resolveCommand } from './index';
import type { CommandContext, SayFunction, SlackEvent } from './types';

export async function processCommand(
  text: string,
  event: SlackEvent,
  say: SayFunction,
  logger: Logger,
  client: AllMiddlewareArgs['client'],
): Promise<void> {
  const parsed = parseCommand(text);
  const commandName = parsed[0].toLowerCase();
  const resolution = resolveCommand(commandName);
  const context: CommandContext = {
    event,
    say,
    logger,
    args: parsed.slice(1),
    invokedName: resolution.invokedName,
    client,
  };

  try {
    if (resolution.registration?.dmOnly && event.channel_type !== 'im') {
      await say({
        text: 'このコマンドはDM専用です。DMで実行してください。',
        ...(event.thread_ts && { thread_ts: event.thread_ts }),
      });
      return;
    }

    await resolution.command.execute(context);
    logCommandSuccess(logger, resolution.registration?.primaryName ?? resolution.invokedName, {
      user: event.user,
      channel: event.channel,
      channelType: event.channel_type,
    });
  } catch (error) {
    await handleCommandError(
      error,
      context,
      resolution.registration?.primaryName ?? resolution.invokedName,
    );
  }
}
