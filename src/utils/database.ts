import db from '../config/database';

/**
 * データベースの初期化を行う
 * テーブルが存在しない場合は作成する
 */
export const initializeDatabase = (): void => {
  // リアクションマッピングテーブルの作成
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

  // グループテーブルの作成
  db.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // グループアイテムテーブルの作成
  db.exec(`
    CREATE TABLE IF NOT EXISTS group_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      item_text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE
    );
  `);

  console.log('データベースの初期化が完了しました。');
};

/**
 * データベース接続を閉じる
 */
export const closeDatabase = (): void => {
  db.close();
  console.log('データベース接続を閉じました。');
};