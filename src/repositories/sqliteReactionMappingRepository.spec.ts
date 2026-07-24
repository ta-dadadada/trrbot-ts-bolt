import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initializeSchema } from '../db/schema';
import { SqliteReactionMappingRepository } from './sqliteReactionMappingRepository';

describe('SqliteReactionMappingRepository', () => {
  let db: Database.Database;
  let repository: SqliteReactionMappingRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    initializeSchema(db);
    repository = new SqliteReactionMappingRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  it('マッピングを作成して一覧取得する', () => {
    const id = repository.create('hello', ':wave:');

    expect(repository.getAll()).toEqual([
      expect.objectContaining({
        id,
        triggerText: 'hello',
        reaction: ':wave:',
        usageCount: 0,
      }),
    ]);
  });

  it('トリガーとリアクションの組み合わせで削除する', () => {
    repository.create('hello', ':wave:');

    expect(repository.deleteByTriggerAndReaction('hello', ':wave:')).toBe(true);
    expect(repository.deleteByTriggerAndReaction('hello', ':wave:')).toBe(false);
  });

  it('使用回数を更新する', () => {
    repository.create('hello', ':wave:');

    expect(repository.incrementUsageCount('hello', ':wave:')).toBe(true);
    expect(repository.incrementUsageCount('missing', ':wave:')).toBe(false);
    expect(repository.getAll()[0].usageCount).toBe(1);
  });
});
