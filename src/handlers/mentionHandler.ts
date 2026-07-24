import type { App } from '@slack/bolt';
import type { ProcessCommand } from '../commands/router';
import { normalizeAppMentionEvent } from '../slack/eventNormalizer';

export interface MentionHandlerDependencies {
  processCommand: ProcessCommand;
}

export const registerMentionHandlers = (
  app: App,
  dependencies: MentionHandlerDependencies,
): void => {
  app.event('app_mention', async ({ event, say, logger, client }) => {
    const text = event.text.replace(/^<@[A-Z0-9]+>/, '').trim();
    await dependencies.processCommand(text, normalizeAppMentionEvent(event), say, logger, client);
  });
};
