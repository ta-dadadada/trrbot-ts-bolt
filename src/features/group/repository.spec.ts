import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { GroupRepository, GroupItemRepository } from './repository';

/**
 * テスト用にインメモリDBのテーブルを作成するヘルパー
 */
function setupTables(db: Database.Database): void {
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
}

describe('GroupRepository', () => {
  let db: Database.Database;
  let repo: GroupRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    setupTables(db);
    repo = new GroupRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('create / getByName', () => {
    it('グループを作成し名前で取得できる', () => {
      const id = repo.create({ name: 'testGroup' });
      expect(id).toBeGreaterThan(0);

      const group = repo.getByName('testGroup');
      expect(group).toBeDefined();
      expect(group!.name).toBe('testGroup');
      expect(group!.id).toBe(id);
    });

    it('存在しないグループ名ならundefinedを返す', () => {
      expect(repo.getByName('unknown')).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('すべてのグループを返す', () => {
      repo.create({ name: 'group1' });
      repo.create({ name: 'group2' });

      const all = repo.getAll();
      expect(all).toHaveLength(2);
      expect(all.map((g) => g.name).sort()).toEqual(['group1', 'group2']);
    });

    it('空の場合は空配列を返す', () => {
      expect(repo.getAll()).toEqual([]);
    });
  });

  describe('delete / deleteByName', () => {
    it('IDで削除できる', () => {
      const id = repo.create({ name: 'toDelete' });
      expect(repo.delete(id)).toBe(true);
      expect(repo.getByName('toDelete')).toBeUndefined();
    });

    it('名前で削除できる', () => {
      repo.create({ name: 'toDelete' });
      expect(repo.deleteByName('toDelete')).toBe(true);
      expect(repo.getByName('toDelete')).toBeUndefined();
    });

    it('存在しないIDの削除はfalse', () => {
      expect(repo.delete(999)).toBe(false);
    });

    it('存在しない名前の削除はfalse', () => {
      expect(repo.deleteByName('nope')).toBe(false);
    });
  });
});

describe('GroupItemRepository', () => {
  let db: Database.Database;
  let groupRepo: GroupRepository;
  let itemRepo: GroupItemRepository;
  let groupId: number;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    setupTables(db);
    groupRepo = new GroupRepository(db);
    itemRepo = new GroupItemRepository(db, groupRepo);
    groupId = groupRepo.create({ name: 'testGroup' });
  });

  afterEach(() => {
    db.close();
  });

  describe('create / getAllByGroupId', () => {
    it('アイテムを作成しグループIDで取得できる', () => {
      const id = itemRepo.create({ groupId, itemText: 'item1' });
      expect(id).toBeGreaterThan(0);

      const items = itemRepo.getAllByGroupId(groupId);
      expect(items).toHaveLength(1);
      expect(items[0].itemText).toBe('item1');
    });
  });

  describe('getAllByGroupName', () => {
    it('グループ名でアイテムを取得できる', () => {
      itemRepo.create({ groupId, itemText: 'item1' });
      itemRepo.create({ groupId, itemText: 'item2' });

      const items = itemRepo.getAllByGroupName('testGroup');
      expect(items).toHaveLength(2);
    });

    it('存在しないグループ名なら空配列を返す', () => {
      expect(itemRepo.getAllByGroupName('unknown')).toEqual([]);
    });
  });

  describe('delete', () => {
    it('IDでアイテムを削除できる', () => {
      const id = itemRepo.create({ groupId, itemText: 'item1' });
      expect(itemRepo.delete(id)).toBe(true);
      expect(itemRepo.getAllByGroupId(groupId)).toHaveLength(0);
    });

    it('存在しないIDはfalse', () => {
      expect(itemRepo.delete(999)).toBe(false);
    });
  });

  describe('deleteAllByGroupId', () => {
    it('グループIDですべてのアイテムを削除する', () => {
      itemRepo.create({ groupId, itemText: 'item1' });
      itemRepo.create({ groupId, itemText: 'item2' });

      expect(itemRepo.deleteAllByGroupId(groupId)).toBe(true);
      expect(itemRepo.getAllByGroupId(groupId)).toHaveLength(0);
    });

    it('アイテムがない場合はfalse', () => {
      expect(itemRepo.deleteAllByGroupId(groupId)).toBe(false);
    });
  });

  describe('deleteByGroupNameAndItemText', () => {
    it('グループ名とアイテムテキストで削除できる', () => {
      itemRepo.create({ groupId, itemText: 'item1' });
      itemRepo.create({ groupId, itemText: 'item2' });

      expect(itemRepo.deleteByGroupNameAndItemText('testGroup', 'item1')).toBe(true);
      expect(itemRepo.getAllByGroupName('testGroup')).toHaveLength(1);
    });

    it('存在しないグループ名ならfalse', () => {
      expect(itemRepo.deleteByGroupNameAndItemText('unknown', 'item1')).toBe(false);
    });
  });

  describe('カスケード削除', () => {
    it('グループ削除時にアイテムも削除される', () => {
      itemRepo.create({ groupId, itemText: 'item1' });
      groupRepo.deleteByName('testGroup');

      expect(itemRepo.getAllByGroupName('testGroup')).toEqual([]);
    });
  });
});
