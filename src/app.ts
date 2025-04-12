import { App } from '@slack/bolt';
import dotenv from 'dotenv';

// 環境変数の読み込み
dotenv.config();

// 必要な環境変数の確認
const { SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, SLACK_APP_TOKEN } = process.env;

if (!SLACK_BOT_TOKEN || !SLACK_SIGNING_SECRET || !SLACK_APP_TOKEN) {
  console.error('必要な環境変数が設定されていません。');
  process.exit(1);
}

// Boltアプリの初期化（ソケットモード必須）
const app = new App({
  token: SLACK_BOT_TOKEN,
  signingSecret: SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: SLACK_APP_TOKEN,
});

export default app;