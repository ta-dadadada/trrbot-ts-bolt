import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { closeDatabase, openDatabase } from './connection';
import { initializeSchema } from './schema';

describe('database schema', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = openDatabase(':memory:');
  });

  afterEach(() => {
    closeDatabase(db);
  });

  it('必要なテーブルを作成すること', () => {
    initializeSchema(db);

    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
      .all() as Array<{ name: string }>;

    expect(tables).toEqual([
      { name: 'group_items' },
      { name: 'groups' },
      { name: 'reaction_mappings' },
    ]);
  });

  it('複数回初期化しても成功すること', () => {
    initializeSchema(db);

    expect(() => initializeSchema(db)).not.toThrow();
  });
});
