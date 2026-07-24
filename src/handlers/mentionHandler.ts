import type { App } from '@slack/bolt';
import { processCommand } from '../commands/router';
import { normalizeAppMentionEvent } from '../slack/eventNormalizer';

export const registerMentionHandlers = (app: App): void => {
  app.event('app_mention', async ({ event, say, logger, client }) => {
    const text = event.text.replace(/^<@[A-Z0-9]+>/, '').trim();
    await processCommand(text, normalizeAppMentionEvent(event), say, logger, client);
  });
};
