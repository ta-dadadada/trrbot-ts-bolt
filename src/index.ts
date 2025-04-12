import app from './app';
import { initializeDatabase, closeDatabase } from './utils/database';
import { registerMessageHandlers } from './handlers/messageHandler';
import { registerMentionHandlers } from './handlers/mentionHandler';

// データベースの初期化
initializeDatabase();

// メッセージハンドラの登録
registerMessageHandlers(app);

// メンションハンドラの登録
registerMentionHandlers(app);

// アプリの起動
(async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    await app.start(port);
    console.log(`⚡️ Bolt アプリが起動しました（ポート: ${port}）`);
  } catch (error) {
    console.error('アプリの起動に失敗しました', error);
    closeDatabase();
    process.exit(1);
  }
})();

// プロセス終了時の処理
process.on('SIGINT', () => {
  console.log('アプリを終了します...');
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('アプリを終了します...');
  closeDatabase();
  process.exit(0);
});
