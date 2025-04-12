import db from '../config/database';

/**
 * グループの型定義
 */
export interface Group {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * グループアイテムの型定義
 */
export interface GroupItem {
  id: number;
  groupId: number;
  itemText: string;
  createdAt: string;
}

/**
 * グループの作成用データの型定義
 */
export interface CreateGroupData {
  name: string;
}

/**
 * グループアイテムの作成用データの型定義
 */
export interface CreateGroupItemData {
  groupId: number;
  itemText: string;
}

/**
 * グループの操作を行うクラス
 */
export class GroupModel {
  /**
   * すべてのグループを取得する
   * @returns グループの配列
   */
  static getAll(): Group[] {
    const stmt = db.prepare(`
      SELECT 
        id, 
        name, 
        created_at as createdAt, 
        updated_at as updatedAt 
      FROM groups
    `);
    
    return stmt.all() as Group[];
  }

  /**
   * 指定された名前のグループを取得する
   * @param name グループ名
   * @returns グループ、存在しない場合はundefined
   */
  static getByName(name: string): Group | undefined {
    const stmt = db.prepare(`
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

  /**
   * 新しいグループを作成する
   * @param data 作成するグループのデータ
   * @returns 作成されたグループのID
   */
  static create(data: CreateGroupData): number {
    const stmt = db.prepare('INSERT INTO groups (name) VALUES (?)');
    const result = stmt.run(data.name);
    return result.lastInsertRowid as number;
  }

  /**
   * 指定されたIDのグループを削除する
   * @param id 削除するグループのID
   * @returns 削除に成功した場合はtrue、失敗した場合はfalse
   */
  static delete(id: number): boolean {
    const stmt = db.prepare('DELETE FROM groups WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * 指定された名前のグループを削除する
   * @param name 削除するグループの名前
   * @returns 削除に成功した場合はtrue、失敗した場合はfalse
   */
  static deleteByName(name: string): boolean {
    const stmt = db.prepare('DELETE FROM groups WHERE name = ?');
    const result = stmt.run(name);
    return result.changes > 0;
  }
}

/**
 * グループアイテムの操作を行うクラス
 */
export class GroupItemModel {
  /**
   * 指定されたグループIDに属するすべてのアイテムを取得する
   * @param groupId グループID
   * @returns グループアイテムの配列
   */
  static getAllByGroupId(groupId: number): GroupItem[] {
    const stmt = db.prepare(`
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

  /**
   * 指定されたグループ名に属するすべてのアイテムを取得する
   * @param groupName グループ名
   * @returns グループアイテムの配列
   */
  static getAllByGroupName(groupName: string): GroupItem[] {
    const group = GroupModel.getByName(groupName);
    if (!group) {
      return [];
    }
    
    return GroupItemModel.getAllByGroupId(group.id);
  }

  /**
   * 新しいグループアイテムを作成する
   * @param data 作成するグループアイテムのデータ
   * @returns 作成されたグループアイテムのID
   */
  static create(data: CreateGroupItemData): number {
    const stmt = db.prepare(`
      INSERT INTO group_items (group_id, item_text)
      VALUES (?, ?)
    `);
    
    const result = stmt.run(data.groupId, data.itemText);
    return result.lastInsertRowid as number;
  }

  /**
   * 指定されたIDのグループアイテムを削除する
   * @param id 削除するグループアイテムのID
   * @returns 削除に成功した場合はtrue、失敗した場合はfalse
   */
  static delete(id: number): boolean {
    const stmt = db.prepare('DELETE FROM group_items WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * 指定されたグループIDに属するすべてのアイテムを削除する
   * @param groupId グループID
   * @returns 削除に成功した場合はtrue、失敗した場合はfalse
   */
  static deleteAllByGroupId(groupId: number): boolean {
    const stmt = db.prepare('DELETE FROM group_items WHERE group_id = ?');
    const result = stmt.run(groupId);
    return result.changes > 0;
  }

  /**
   * 指定されたグループ名とアイテムテキストのグループアイテムを削除する
   * @param groupName グループ名
   * @param itemText アイテムテキスト
   * @returns 削除に成功した場合はtrue、失敗した場合はfalse
   */
  static deleteByGroupNameAndItemText(groupName: string, itemText: string): boolean {
    const group = GroupModel.getByName(groupName);
    if (!group) {
      return false;
    }
    
    const stmt = db.prepare('DELETE FROM group_items WHERE group_id = ? AND item_text = ?');
    const result = stmt.run(group.id, itemText);
    return result.changes > 0;
  }
}