import app from './app';
import { closeDatabase, openDatabase } from './db/connection';
import { initializeSchema } from './db/schema';
import { registerMessageHandlers } from './handlers/messageHandler';
import { registerMentionHandlers } from './handlers/mentionHandler';
import { createLogger } from './utils/logger';

const logger = createLogger('app');

// アプリの起動
(async () => {
  try {
    const db = openDatabase();
    initializeSchema(db);

    // メッセージハンドラの登録
    registerMessageHandlers(app);

    // メンションハンドラの登録
    registerMentionHandlers(app);

    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    await app.start(port);
    logger.info('Boltアプリ起動', {
      port,
      mode: process.env.SLACK_SOCKET_MODE !== 'false' ? 'socket' : 'http',
    });
  } catch (error) {
    logger.error('アプリ起動失敗', {
      error: error instanceof Error ? error.message : String(error),
    });
    closeDatabase();
    process.exit(1);
  }
})();

// プロセス終了時の処理
process.on('SIGINT', () => {
  logger.info('アプリを終了します（SIGINT）');
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('アプリを終了します（SIGTERM）');
  closeDatabase();
  process.exit(0);
});
