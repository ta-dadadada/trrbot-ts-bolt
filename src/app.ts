import { App } from '@slack/bolt';
import dotenv from 'dotenv';
import { logger } from './utils/logger';

// 環境変数の読み込み
dotenv.config();

// 必要な環境変数の確認
const { SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, SLACK_APP_TOKEN, SLACK_SOCKET_MODE } = process.env;
const socketMode = SLACK_SOCKET_MODE !== 'false';

if (!SLACK_BOT_TOKEN || !SLACK_SIGNING_SECRET || (socketMode && !SLACK_APP_TOKEN)) {
  logger.error('必要な環境変数が設定されていません', {
    required: ['SLACK_BOT_TOKEN', 'SLACK_SIGNING_SECRET', socketMode && 'SLACK_APP_TOKEN'].filter(
      Boolean,
    ),
    socketMode,
  });
  process.exit(1);
}

// Boltアプリの初期化（統一loggerを注入）
const app = new App({
  token: SLACK_BOT_TOKEN,
  signingSecret: SLACK_SIGNING_SECRET,
  socketMode: socketMode,
  appToken: SLACK_APP_TOKEN,
  logger: logger, // 統一loggerインスタンスを使用
});

export default app;
