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
