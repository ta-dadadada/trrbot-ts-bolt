import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { createLogger } from '../utils/logger';

const logger = createLogger('database');

const defaultDatabasePath = (): string => path.resolve(process.cwd(), 'data', 'trrbot.db');

/**
 * アプリケーションで共有するデータベース接続を開く
 */
export const openDatabase = (dbPath: string = defaultDatabasePath()): Database.Database => {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const database = new Database(dbPath);
  database.pragma('foreign_keys = ON');
  return database;
};

/**
 * 指定したデータベース接続を閉じる
 */
export const closeDatabase = (database: Database.Database): void => {
  if (!database.open) {
    return;
  }

  database.close();
  logger.info('データベース接続クローズ');
};
