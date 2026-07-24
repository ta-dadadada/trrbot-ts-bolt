import type Database from 'better-sqlite3';
import type { Group, GroupItem } from '../models/group';

export interface GroupRepository {
  getAllGroups(): Group[];
  getGroupByName(name: string): Group | undefined;
  createGroup(name: string): number;
  deleteGroupByName(name: string): boolean;
  getItemsByGroupName(groupName: string): GroupItem[];
  createItem(groupId: number, itemText: string): number;
  createItems(groupId: number, itemTexts: string[]): number[];
  deleteAllItemsByGroupId(groupId: number): boolean;
  deleteItemByGroupNameAndText(groupName: string, itemText: string): boolean;
}

/**
 * SQLite上のグループとグループアイテムを永続化する。
 */
export class SqliteGroupRepository implements GroupRepository {
  constructor(private readonly db: Database.Database) {}

  getAllGroups(): Group[] {
    const statement = this.db.prepare(`
      SELECT
        id,
        name,
        created_at as createdAt,
        updated_at as updatedAt
      FROM groups
    `);

    return statement.all() as Group[];
  }

  getGroupByName(name: string): Group | undefined {
    const statement = this.db.prepare(`
      SELECT
        id,
        name,
        created_at as createdAt,
        updated_at as updatedAt
      FROM groups
      WHERE name = ?
    `);

    return statement.get(name) as Group | undefined;
  }

  createGroup(name: string): number {
    const statement = this.db.prepare('INSERT INTO groups (name) VALUES (?)');
    const result = statement.run(name);
    return result.lastInsertRowid as number;
  }

  deleteGroupByName(name: string): boolean {
    const statement = this.db.prepare('DELETE FROM groups WHERE name = ?');
    return statement.run(name).changes > 0;
  }

  getItemsByGroupName(groupName: string): GroupItem[] {
    const statement = this.db.prepare(`
      SELECT
        group_items.id,
        group_items.group_id as groupId,
        group_items.item_text as itemText,
        group_items.created_at as createdAt
      FROM group_items
      INNER JOIN groups ON groups.id = group_items.group_id
      WHERE groups.name = ?
    `);

    return statement.all(groupName) as GroupItem[];
  }

  createItem(groupId: number, itemText: string): number {
    const statement = this.db.prepare(`
      INSERT INTO group_items (group_id, item_text)
      VALUES (?, ?)
    `);
    const result = statement.run(groupId, itemText);
    return result.lastInsertRowid as number;
  }

  createItems(groupId: number, itemTexts: string[]): number[] {
    const insert = this.db.prepare(`
      INSERT INTO group_items (group_id, item_text)
      VALUES (?, ?)
    `);
    const createAll = this.db.transaction((texts: string[]): number[] =>
      texts.map((itemText) => insert.run(groupId, itemText).lastInsertRowid as number),
    );

    return createAll(itemTexts);
  }

  deleteAllItemsByGroupId(groupId: number): boolean {
    const statement = this.db.prepare('DELETE FROM group_items WHERE group_id = ?');
    return statement.run(groupId).changes > 0;
  }

  deleteItemByGroupNameAndText(groupName: string, itemText: string): boolean {
    const statement = this.db.prepare(`
      DELETE FROM group_items
      WHERE group_id = (SELECT id FROM groups WHERE name = ?)
        AND item_text = ?
    `);
    return statement.run(groupName, itemText).changes > 0;
  }
}
