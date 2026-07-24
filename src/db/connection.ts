import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { createLogger } from '../utils/logger';

const logger = createLogger('database');
let instance: Database.Database | undefined;

const defaultDatabasePath = (): string => path.resolve(process.cwd(), 'data', 'trrbot.db');

/**
 * アプリケーションで共有するデータベース接続を開く
 */
export const openDatabase = (dbPath: string = defaultDatabasePath()): Database.Database => {
  if (instance) {
    return instance;
  }

  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  instance = new Database(dbPath);
  instance.pragma('foreign_keys = ON');
  return instance;
};

/**
 * 開かれているデータベース接続を取得する
 */
export const getDatabase = (): Database.Database => {
  if (!instance) {
    throw new Error('データベースが初期化されていません。openDatabase()を先に呼び出してください。');
  }

  return instance;
};

/**
 * データベース接続を閉じる
 */
export const closeDatabase = (): void => {
  if (!instance) {
    return;
  }

  const database = instance;
  instance = undefined;
  database.close();
  logger.info('データベース接続クローズ');
};
