import type Database from 'better-sqlite3';
import { createLogger } from '../utils/logger';

const logger = createLogger('database');

/**
 * データベースのスキーマを初期化する
 *
 * スキーマ変更が必要になった場合は、PRAGMA user_versionによる
 * バージョン管理へ移行する。
 */
export const initializeSchema = (db: Database.Database): void => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS reaction_mappings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trigger_text TEXT NOT NULL,
      reaction TEXT NOT NULL,
      usage_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS group_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      item_text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE
    );
  `);

  logger.info('データベース初期化完了');
};
