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
