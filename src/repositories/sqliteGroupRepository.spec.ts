import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initializeSchema } from '../db/schema';
import { SqliteGroupRepository } from './sqliteGroupRepository';

describe('SqliteGroupRepository', () => {
  let db: Database.Database;
  let repository: SqliteGroupRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    initializeSchema(db);
    repository = new SqliteGroupRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  it('グループを作成・取得・削除できる', () => {
    const id = repository.createGroup('昼食');

    expect(repository.getGroupByName('昼食')).toMatchObject({ id, name: '昼食' });
    expect(repository.getAllGroups()).toEqual([expect.objectContaining({ id, name: '昼食' })]);
    expect(repository.deleteGroupByName('昼食')).toBe(true);
    expect(repository.deleteGroupByName('昼食')).toBe(false);
  });

  it('同じ名前のグループは作成できない', () => {
    repository.createGroup('昼食');

    expect(() => repository.createGroup('昼食')).toThrow();
  });

  it('グループアイテムを作成・取得・削除できる', () => {
    const groupId = repository.createGroup('昼食');
    const itemId = repository.createItem(groupId, 'ラーメン');

    expect(repository.getItemsByGroupName('昼食')).toEqual([
      expect.objectContaining({ id: itemId, groupId, itemText: 'ラーメン' }),
    ]);
    expect(repository.getItemsByGroupName('存在しない')).toEqual([]);
    expect(repository.deleteItemByGroupNameAndText('昼食', 'ラーメン')).toBe(true);
    expect(repository.deleteItemByGroupNameAndText('昼食', 'ラーメン')).toBe(false);
  });

  it('複数アイテムを1つのトランザクションで作成する', () => {
    const groupId = repository.createGroup('昼食');

    const ids = repository.createItems(groupId, ['ラーメン', 'うどん']);

    expect(ids).toHaveLength(2);
    expect(repository.getItemsByGroupName('昼食').map((item) => item.itemText)).toEqual([
      'ラーメン',
      'うどん',
    ]);
  });

  it('複数アイテムの途中で失敗した場合は全件をロールバックする', () => {
    const groupId = repository.createGroup('昼食');
    db.exec('CREATE UNIQUE INDEX unique_group_item ON group_items(group_id, item_text)');

    expect(() => repository.createItems(groupId, ['ラーメン', 'ラーメン'])).toThrow();
    expect(repository.getItemsByGroupName('昼食')).toEqual([]);
  });

  it('グループ削除時に所属アイテムをCASCADE削除する', () => {
    const groupId = repository.createGroup('昼食');
    repository.createItem(groupId, 'ラーメン');

    repository.deleteGroupByName('昼食');

    const count = db.prepare('SELECT COUNT(*) AS count FROM group_items').get() as {
      count: number;
    };
    expect(count.count).toBe(0);
  });

  it('グループ内の全アイテムを削除する', () => {
    const groupId = repository.createGroup('昼食');
    repository.createItems(groupId, ['ラーメン', 'うどん']);

    expect(repository.deleteAllItemsByGroupId(groupId)).toBe(true);
    expect(repository.deleteAllItemsByGroupId(groupId)).toBe(false);
  });
});
