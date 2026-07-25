import { App } from '@slack/bolt';
import type { Logger } from '@slack/logger';
import type { AppConfig } from './config/appConfig';

/**
 * 起動設定からSlack Boltアプリケーションを作成する。
 */
export function createSlackApp(config: AppConfig, logger: Logger): App {
  return new App({
    token: config.botToken,
    signingSecret: config.signingSecret,
    socketMode: config.socketMode,
    appToken: config.appToken,
    logger,
  });
}
