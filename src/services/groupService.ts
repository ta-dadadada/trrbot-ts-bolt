import type { Group, GroupItem } from '../models/group';
import type { GroupRepository } from '../repositories/sqliteGroupRepository';

export type RandomItemPicker = <T>(items: T[]) => T | undefined;

/**
 * Group系コマンドが利用するユースケース。
 */
export interface GroupOperations {
  getAllGroups(): Group[];
  createGroup(name: string): number;
  deleteGroup(name: string): boolean;
  getItemsByGroupName(groupName: string): GroupItem[];
  getRandomItemFromGroup(groupName: string): string | undefined;
  getRandomItemFromGroupExcluding(groupName: string, excludeItems: string[]): string | undefined;
  addItemToGroup(groupName: string, itemText: string): number | undefined;
  addItemsToGroup(groupName: string, itemTexts: string[]): number[];
  removeItemFromGroup(groupName: string, itemText: string): boolean;
  clearGroupItems(groupName: string): boolean;
}

/**
 * グループ関連のユースケースを提供する。
 */
export class GroupService implements GroupOperations {
  constructor(
    private readonly repository: GroupRepository,
    private readonly pickRandomItem: RandomItemPicker,
  ) {}

  getAllGroups(): Group[] {
    return this.repository.getAllGroups();
  }

  createGroup(name: string): number {
    if (this.repository.getGroupByName(name)) {
      throw new Error(`グループ名 "${name}" は既に存在します。`);
    }

    return this.repository.createGroup(name);
  }

  deleteGroup(name: string): boolean {
    return this.repository.deleteGroupByName(name);
  }

  getItemsByGroupName(groupName: string): GroupItem[] {
    return this.repository.getItemsByGroupName(groupName);
  }

  getRandomItemFromGroup(groupName: string): string | undefined {
    const items = this.repository.getItemsByGroupName(groupName);
    if (items.length === 0) {
      return undefined;
    }

    return this.pickRandomItem(items)?.itemText;
  }

  getRandomItemFromGroupExcluding(groupName: string, excludeItems: string[]): string | undefined {
    const items = this.repository
      .getItemsByGroupName(groupName)
      .filter((item) => !excludeItems.includes(item.itemText));
    if (items.length === 0) {
      return undefined;
    }

    return this.pickRandomItem(items)?.itemText;
  }

  addItemToGroup(groupName: string, itemText: string): number | undefined {
    const group = this.repository.getGroupByName(groupName);
    if (!group) {
      return undefined;
    }

    return this.repository.createItem(group.id, itemText);
  }

  addItemsToGroup(groupName: string, itemTexts: string[]): number[] {
    const group = this.repository.getGroupByName(groupName);
    if (!group) {
      return [];
    }

    return this.repository.createItems(group.id, itemTexts);
  }

  removeItemFromGroup(groupName: string, itemText: string): boolean {
    return this.repository.deleteItemByGroupNameAndText(groupName, itemText);
  }

  clearGroupItems(groupName: string): boolean {
    const group = this.repository.getGroupByName(groupName);
    if (!group) {
      return false;
    }

    return this.repository.deleteAllItemsByGroupId(group.id);
  }
}
