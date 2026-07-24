import type Database from 'better-sqlite3';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { closeDatabase, openDatabase } from '../db/connection';
import { initializeSchema } from '../db/schema';
import { GroupItemModel, GroupModel } from './group';

describe('GroupModel / GroupItemModel', () => {
  let db: Database.Database;

  beforeAll(() => {
    db = openDatabase(':memory:');
    initializeSchema(db);
  });

  beforeEach(() => {
    db.exec(`
      DELETE FROM group_items;
      DELETE FROM groups;
    `);
  });

  afterAll(() => {
    closeDatabase();
  });

  describe('GroupModel', () => {
    it('グループを作成して取得できること', () => {
      const id = GroupModel.create({ name: '開発チーム' });

      expect(id).toBeTypeOf('number');
      expect(GroupModel.getByName('開発チーム')).toMatchObject({
        id,
        name: '開発チーム',
      });
      expect(GroupModel.getAll()).toEqual([
        expect.objectContaining({
          id,
          name: '開発チーム',
        }),
      ]);
    });

    it('存在しないグループは取得できないこと', () => {
      expect(GroupModel.getByName('存在しない')).toBeUndefined();
    });

    it('同じ名前のグループは作成できないこと', () => {
      GroupModel.create({ name: '重複グループ' });

      expect(() => GroupModel.create({ name: '重複グループ' })).toThrow();
    });

    it('IDでグループを削除し、削除結果を返すこと', () => {
      const id = GroupModel.create({ name: '削除対象' });

      expect(GroupModel.delete(id)).toBe(true);
      expect(GroupModel.delete(id)).toBe(false);
    });

    it('名前でグループを削除し、削除結果を返すこと', () => {
      GroupModel.create({ name: '削除対象' });

      expect(GroupModel.deleteByName('削除対象')).toBe(true);
      expect(GroupModel.deleteByName('削除対象')).toBe(false);
    });
  });

  describe('GroupItemModel', () => {
    it('グループアイテムを作成し、IDとグループ名で取得できること', () => {
      const groupId = GroupModel.create({ name: '候補' });
      const itemId = GroupItemModel.create({ groupId, itemText: 'りんご' });

      const expectedItem = expect.objectContaining({
        id: itemId,
        groupId,
        itemText: 'りんご',
      });
      expect(GroupItemModel.getAllByGroupId(groupId)).toEqual([expectedItem]);
      expect(GroupItemModel.getAllByGroupName('候補')).toEqual([expectedItem]);
    });

    it('存在しないグループ名では空配列を返すこと', () => {
      expect(GroupItemModel.getAllByGroupName('存在しない')).toEqual([]);
    });

    it('IDでアイテムを削除し、削除結果を返すこと', () => {
      const groupId = GroupModel.create({ name: '候補' });
      const itemId = GroupItemModel.create({ groupId, itemText: 'りんご' });

      expect(GroupItemModel.delete(itemId)).toBe(true);
      expect(GroupItemModel.delete(itemId)).toBe(false);
    });

    it('グループIDに属する全アイテムを削除し、削除結果を返すこと', () => {
      const groupId = GroupModel.create({ name: '候補' });
      GroupItemModel.create({ groupId, itemText: 'りんご' });
      GroupItemModel.create({ groupId, itemText: 'みかん' });

      expect(GroupItemModel.deleteAllByGroupId(groupId)).toBe(true);
      expect(GroupItemModel.deleteAllByGroupId(groupId)).toBe(false);
    });

    it('グループ名とテキストでアイテムを削除し、削除結果を返すこと', () => {
      const groupId = GroupModel.create({ name: '候補' });
      GroupItemModel.create({ groupId, itemText: 'りんご' });

      expect(GroupItemModel.deleteByGroupNameAndItemText('候補', 'りんご')).toBe(true);
      expect(GroupItemModel.deleteByGroupNameAndItemText('候補', 'りんご')).toBe(false);
      expect(GroupItemModel.deleteByGroupNameAndItemText('存在しない', 'りんご')).toBe(false);
    });

    it('グループを削除すると所属アイテムも削除されること', () => {
      const groupId = GroupModel.create({ name: '候補' });
      GroupItemModel.create({ groupId, itemText: 'りんご' });

      GroupModel.delete(groupId);

      expect(GroupItemModel.getAllByGroupId(groupId)).toEqual([]);
    });
  });
});
