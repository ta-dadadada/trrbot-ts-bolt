import type Database from 'better-sqlite3';
import type { Group, GroupItem, CreateGroupItemData } from './entities';
import type { IGroupRepository, IGroupItemRepository } from './repository';
import { getRandomItem } from '../../utils/random';

/**
 * グループサービスのインターフェース
 */
export interface IGroupService {
  getAllGroups(): Group[];
  getGroupByName(name: string): Group | undefined;
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
 * グループ関連の処理を行うサービスクラス
 */
export class GroupService implements IGroupService {
  constructor(
    private readonly db: Database.Database,
    private readonly groupRepository: IGroupRepository,
    private readonly groupItemRepository: IGroupItemRepository,
  ) {}

  /**
   * すべてのグループを取得する
   */
  getAllGroups(): Group[] {
    return this.groupRepository.getAll();
  }

  /**
   * 指定された名前のグループを取得する
   */
  getGroupByName(name: string): Group | undefined {
    return this.groupRepository.getByName(name);
  }

  /**
   * 新しいグループを作成する
   * @throws グループ名が既に存在する場合はエラー
   */
  createGroup(name: string): number {
    const existingGroup = this.groupRepository.getByName(name);
    if (existingGroup) {
      throw new Error(`グループ名 "${name}" は既に存在します。`);
    }

    return this.groupRepository.create({ name });
  }

  /**
   * グループを削除する
   */
  deleteGroup(name: string): boolean {
    return this.groupRepository.deleteByName(name);
  }

  /**
   * 指定されたグループに属するすべてのアイテムを取得する
   */
  getItemsByGroupName(groupName: string): GroupItem[] {
    return this.groupItemRepository.getAllByGroupName(groupName);
  }

  /**
   * 指定されたグループからランダムにアイテムを1つ選択する
   */
  getRandomItemFromGroup(groupName: string): string | undefined {
    const items = this.groupItemRepository.getAllByGroupName(groupName);
    if (items.length === 0) {
      return undefined;
    }

    const randomItem = getRandomItem(items);
    return randomItem?.itemText;
  }

  /**
   * 指定されたグループから特定のアイテムを除外してランダムにアイテムを1つ選択する
   */
  getRandomItemFromGroupExcluding(groupName: string, excludeItems: string[]): string | undefined {
    const items = this.groupItemRepository.getAllByGroupName(groupName);
    if (items.length === 0) {
      return undefined;
    }

    const filteredItems = items.filter((item) => !excludeItems.includes(item.itemText));

    if (filteredItems.length === 0) {
      return undefined;
    }

    const randomItem = getRandomItem(filteredItems);
    return randomItem?.itemText;
  }

  /**
   * 指定されたグループに新しいアイテムを追加する
   */
  addItemToGroup(groupName: string, itemText: string): number | undefined {
    const group = this.groupRepository.getByName(groupName);
    if (!group) {
      return undefined;
    }

    const data: CreateGroupItemData = {
      groupId: group.id,
      itemText,
    };

    return this.groupItemRepository.create(data);
  }

  /**
   * 指定されたグループに複数のアイテムを一度に追加する
   */
  addItemsToGroup(groupName: string, itemTexts: string[]): number[] {
    const group = this.groupRepository.getByName(groupName);
    if (!group) {
      return [];
    }

    const createdIds: number[] = [];

    this.db.transaction(() => {
      for (const itemText of itemTexts) {
        const data: CreateGroupItemData = {
          groupId: group.id,
          itemText,
        };

        const id = this.groupItemRepository.create(data);
        createdIds.push(id);
      }
    })();

    return createdIds;
  }

  /**
   * 指定されたグループからアイテムを削除する
   */
  removeItemFromGroup(groupName: string, itemText: string): boolean {
    return this.groupItemRepository.deleteByGroupNameAndItemText(groupName, itemText);
  }

  /**
   * 指定されたグループのすべてのアイテムを削除する
   */
  clearGroupItems(groupName: string): boolean {
    const group = this.groupRepository.getByName(groupName);
    if (!group) {
      return false;
    }

    return this.groupItemRepository.deleteAllByGroupId(group.id);
  }
}
