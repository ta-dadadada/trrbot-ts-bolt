import type Database from 'better-sqlite3';
import type { Group, GroupItem, CreateGroupData, CreateGroupItemData } from './entities';

/**
 * グループリポジトリのインターフェース
 */
export interface IGroupRepository {
  getAll(): Group[];
  getByName(name: string): Group | undefined;
  create(data: CreateGroupData): number;
  delete(id: number): boolean;
  deleteByName(name: string): boolean;
}

/**
 * グループアイテムリポジトリのインターフェース
 */
export interface IGroupItemRepository {
  getAllByGroupId(groupId: number): GroupItem[];
  getAllByGroupName(groupName: string): GroupItem[];
  create(data: CreateGroupItemData): number;
  delete(id: number): boolean;
  deleteAllByGroupId(groupId: number): boolean;
  deleteByGroupNameAndItemText(groupName: string, itemText: string): boolean;
}

/**
 * グループリポジトリの実装
 */
export class GroupRepository implements IGroupRepository {
  constructor(private readonly db: Database.Database) {}

  getAll(): Group[] {
    const stmt = this.db.prepare(`
      SELECT
        id,
        name,
        created_at as createdAt,
        updated_at as updatedAt
      FROM groups
    `);

    return stmt.all() as Group[];
  }

  getByName(name: string): Group | undefined {
    const stmt = this.db.prepare(`
      SELECT
        id,
        name,
        created_at as createdAt,
        updated_at as updatedAt
      FROM groups
      WHERE name = ?
    `);

    return stmt.get(name) as Group | undefined;
  }

  create(data: CreateGroupData): number {
    const stmt = this.db.prepare('INSERT INTO groups (name) VALUES (?)');
    const result = stmt.run(data.name);
    return result.lastInsertRowid as number;
  }

  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM groups WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  deleteByName(name: string): boolean {
    const stmt = this.db.prepare('DELETE FROM groups WHERE name = ?');
    const result = stmt.run(name);
    return result.changes > 0;
  }
}

/**
 * グループアイテムリポジトリの実装
 */
export class GroupItemRepository implements IGroupItemRepository {
  constructor(
    private readonly db: Database.Database,
    private readonly groupRepository: IGroupRepository,
  ) {}

  getAllByGroupId(groupId: number): GroupItem[] {
    const stmt = this.db.prepare(`
      SELECT
        id,
        group_id as groupId,
        item_text as itemText,
        created_at as createdAt
      FROM group_items
      WHERE group_id = ?
    `);

    return stmt.all(groupId) as GroupItem[];
  }

  getAllByGroupName(groupName: string): GroupItem[] {
    const group = this.groupRepository.getByName(groupName);
    if (!group) {
      return [];
    }

    return this.getAllByGroupId(group.id);
  }

  create(data: CreateGroupItemData): number {
    const stmt = this.db.prepare(`
      INSERT INTO group_items (group_id, item_text)
      VALUES (?, ?)
    `);

    const result = stmt.run(data.groupId, data.itemText);
    return result.lastInsertRowid as number;
  }

  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM group_items WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  deleteAllByGroupId(groupId: number): boolean {
    const stmt = this.db.prepare('DELETE FROM group_items WHERE group_id = ?');
    const result = stmt.run(groupId);
    return result.changes > 0;
  }

  deleteByGroupNameAndItemText(groupName: string, itemText: string): boolean {
    const group = this.groupRepository.getByName(groupName);
    if (!group) {
      return false;
    }

    const stmt = this.db.prepare('DELETE FROM group_items WHERE group_id = ? AND item_text = ?');
    const result = stmt.run(group.id, itemText);
    return result.changes > 0;
  }
}
