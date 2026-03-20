import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { ReactionMappingRepository } from './repository';

function setupTables(db: Database.Database): void {
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
}

describe('ReactionMappingRepository', () => {
  let db: Database.Database;
  let repo: ReactionMappingRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    setupTables(db);
    repo = new ReactionMappingRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('create / getAll', () => {
    it('マッピングを作成しすべて取得できる', () => {
      const id = repo.create({ triggerText: 'hello', reaction: ':wave:' });
      expect(id).toBeGreaterThan(0);

      const all = repo.getAll();
      expect(all).toHaveLength(1);
      expect(all[0].triggerText).toBe('hello');
      expect(all[0].reaction).toBe(':wave:');
      expect(all[0].usageCount).toBe(0);
    });
  });

  describe('getByTriggerText', () => {
    it('トリガーテキストでフィルタできる', () => {
      repo.create({ triggerText: 'hello', reaction: ':wave:' });
      repo.create({ triggerText: 'hello', reaction: ':smile:' });
      repo.create({ triggerText: 'bye', reaction: ':wave:' });

      const result = repo.getByTriggerText('hello');
      expect(result).toHaveLength(2);
      expect(result.every((m) => m.triggerText === 'hello')).toBe(true);
    });

    it('マッチしない場合は空配列を返す', () => {
      expect(repo.getByTriggerText('nope')).toEqual([]);
    });
  });

  describe('delete', () => {
    it('IDで削除できる', () => {
      const id = repo.create({ triggerText: 'hello', reaction: ':wave:' });
      expect(repo.delete(id)).toBe(true);
      expect(repo.getAll()).toHaveLength(0);
    });

    it('存在しないIDはfalse', () => {
      expect(repo.delete(999)).toBe(false);
    });
  });

  describe('deleteByTriggerAndReaction', () => {
    it('トリガーとリアクションの組み合わせで削除できる', () => {
      repo.create({ triggerText: 'hello', reaction: ':wave:' });
      repo.create({ triggerText: 'hello', reaction: ':smile:' });

      expect(repo.deleteByTriggerAndReaction('hello', ':wave:')).toBe(true);
      const remaining = repo.getAll();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].reaction).toBe(':smile:');
    });

    it('存在しない組み合わせはfalse', () => {
      expect(repo.deleteByTriggerAndReaction('nope', ':x:')).toBe(false);
    });
  });

  describe('incrementUsageCount', () => {
    it('使用回数をインクリメントする', () => {
      repo.create({ triggerText: 'hello', reaction: ':wave:' });

      expect(repo.incrementUsageCount('hello', ':wave:')).toBe(true);
      expect(repo.incrementUsageCount('hello', ':wave:')).toBe(true);

      const all = repo.getAll();
      expect(all[0].usageCount).toBe(2);
    });

    it('存在しないマッピングはfalse', () => {
      expect(repo.incrementUsageCount('nope', ':x:')).toBe(false);
    });
  });
});
