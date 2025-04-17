import { GroupModel, GroupItemModel, Group, GroupItem, CreateGroupData, CreateGroupItemData } from '../models/group';
import db from '../config/database';
import { getRandomItem } from '../utils/random';

/**
 * グループ関連の処理を行うサービスクラス
 */
export class GroupService {
  /**
   * すべてのグループを取得する
   * @returns グループの配列
   */
  static getAllGroups(): Group[] {
    return GroupModel.getAll();
  }

  /**
   * 指定された名前のグループを取得する
   * @param name グループ名
   * @returns グループ、存在しない場合はundefined
   */
  static getGroupByName(name: string): Group | undefined {
    return GroupModel.getByName(name);
  }

  /**
   * 新しいグループを作成する
   * @param name グループ名
   * @returns 作成されたグループのID
   * @throws グループ名が既に存在する場合はエラー
   */
  static createGroup(name: string): number {
    // グループ名の重複チェック
    const existingGroup = GroupModel.getByName(name);
    if (existingGroup) {
      throw new Error(`グループ名 "${name}" は既に存在します。`);
    }
    
    const data: CreateGroupData = { name };
    return GroupModel.create(data);
  }

  /**
   * グループを削除する
   * @param name グループ名
   * @returns 削除に成功した場合はtrue、失敗した場合はfalse
   */
  static deleteGroup(name: string): boolean {
    return GroupModel.deleteByName(name);
  }

  /**
   * 指定されたグループに属するすべてのアイテムを取得する
   * @param groupName グループ名
   * @returns グループアイテムの配列
   */
  static getItemsByGroupName(groupName: string): GroupItem[] {
    return GroupItemModel.getAllByGroupName(groupName);
  }

  /**
   * 指定されたグループからランダムにアイテムを1つ選択する
   * @param groupName グループ名
   * @returns ランダムに選択されたアイテムのテキスト、グループが存在しないか空の場合はundefined
   */
  static getRandomItemFromGroup(groupName: string): string | undefined {
    const items = GroupItemModel.getAllByGroupName(groupName);
    if (items.length === 0) {
      return undefined;
    }
    
    const randomItem = getRandomItem(items);
    return randomItem?.itemText;
  }

  /**
   * 指定されたグループから特定のアイテムを除外してランダムにアイテムを1つ選択する
   * @param groupName グループ名
   * @param excludeItems 除外するアイテムの配列
   * @returns ランダムに選択されたアイテムのテキスト、グループが存在しないか空の場合はundefined
   */
  static getRandomItemFromGroupExcluding(groupName: string, excludeItems: string[]): string | undefined {
    const items = GroupItemModel.getAllByGroupName(groupName);
    if (items.length === 0) {
      return undefined;
    }
    
    // 除外アイテムを除いたリストを作成
    const filteredItems = items.filter(item => !excludeItems.includes(item.itemText));
    
    if (filteredItems.length === 0) {
      return undefined;
    }
    
    const randomItem = getRandomItem(filteredItems);
    return randomItem?.itemText;
  }

  /**
   * 指定されたグループに新しいアイテムを追加する
   * @param groupName グループ名
   * @param itemText アイテムテキスト（ユーザーメンション `<@USER_ID>` 形式も対応）
   * @returns 作成されたアイテムのID、グループが存在しない場合はundefined
   */
  static addItemToGroup(groupName: string, itemText: string): number | undefined {
    const group = GroupModel.getByName(groupName);
    if (!group) {
      return undefined;
    }
    
    const data: CreateGroupItemData = {
      groupId: group.id,
      itemText,
    };
    
    return GroupItemModel.create(data);
  }

  /**
   * 指定されたグループに複数のアイテムを一度に追加する
   * @param groupName グループ名
   * @param itemTexts アイテムテキストの配列（ユーザーメンション `<@USER_ID>` 形式も対応）
   * @returns 作成されたアイテムのID配列、グループが存在しない場合は空配列
   */
  static addItemsToGroup(groupName: string, itemTexts: string[]): number[] {
    const group = GroupModel.getByName(groupName);
    if (!group) {
      return [];
    }

    const createdIds: number[] = [];
    
    // トランザクションを開始
    db.transaction(() => {
      for (const itemText of itemTexts) {
        const data: CreateGroupItemData = {
          groupId: group.id,
          itemText,
        };
        
        const id = GroupItemModel.create(data);
        createdIds.push(id);
      }
    })();
    
    return createdIds;
  }

  /**
   * 指定されたグループからアイテムを削除する
   * @param groupName グループ名
   * @param itemText アイテムテキスト
   * @returns 削除に成功した場合はtrue、失敗した場合はfalse
   */
  static removeItemFromGroup(groupName: string, itemText: string): boolean {
    return GroupItemModel.deleteByGroupNameAndItemText(groupName, itemText);
  }

  /**
   * 指定されたグループのすべてのアイテムを削除する
   * @param groupName グループ名
   * @returns 削除に成功した場合はtrue、失敗した場合はfalse
   */
  static clearGroupItems(groupName: string): boolean {
    const group = GroupModel.getByName(groupName);
    if (!group) {
      return false;
    }
    
    return GroupItemModel.deleteAllByGroupId(group.id);
  }
}