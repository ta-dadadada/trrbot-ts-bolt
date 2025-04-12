import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// データベースディレクトリの確認と作成
const dbDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// データベースファイルのパス
const dbPath = path.join(dbDir, 'trrbot.db');

// データベース接続
const db = new Database(dbPath);

// 外部キー制約を有効化
db.pragma('foreign_keys = ON');

export default db;