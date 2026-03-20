import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GroupService } from './service';
import type { IGroupRepository, IGroupItemRepository } from './repository';
import type { Group, GroupItem } from './entities';
import type Database from 'better-sqlite3';

describe('GroupService', () => {
  let service: GroupService;
  let mockGroupRepo: IGroupRepository;
  let mockGroupItemRepo: IGroupItemRepository;
  let mockDb: Database.Database;

  const sampleGroup: Group = {
    id: 1,
    name: 'testGroup',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  };

  const sampleItems: GroupItem[] = [
    { id: 1, groupId: 1, itemText: 'item1', createdAt: '2025-01-01' },
    { id: 2, groupId: 1, itemText: 'item2', createdAt: '2025-01-01' },
    { id: 3, groupId: 1, itemText: 'item3', createdAt: '2025-01-01' },
  ];

  beforeEach(() => {
    mockGroupRepo = {
      getAll: vi.fn().mockReturnValue([sampleGroup]),
      getByName: vi.fn().mockReturnValue(sampleGroup),
      create: vi.fn().mockReturnValue(1),
      delete: vi.fn().mockReturnValue(true),
      deleteByName: vi.fn().mockReturnValue(true),
    };

    mockGroupItemRepo = {
      getAllByGroupId: vi.fn().mockReturnValue(sampleItems),
      getAllByGroupName: vi.fn().mockReturnValue(sampleItems),
      create: vi.fn().mockReturnValue(1),
      delete: vi.fn().mockReturnValue(true),
      deleteAllByGroupId: vi.fn().mockReturnValue(true),
      deleteByGroupNameAndItemText: vi.fn().mockReturnValue(true),
    };

    // transaction mock: immediately execute the callback
    mockDb = {
      transaction: vi.fn((fn: () => void) => fn),
    } as unknown as Database.Database;

    service = new GroupService(mockDb, mockGroupRepo, mockGroupItemRepo);
  });

  describe('getAllGroups', () => {
    it('すべてのグループを返す', () => {
      const result = service.getAllGroups();
      expect(result).toEqual([sampleGroup]);
      expect(mockGroupRepo.getAll).toHaveBeenCalled();
    });
  });

  describe('getGroupByName', () => {
    it('名前でグループを返す', () => {
      const result = service.getGroupByName('testGroup');
      expect(result).toEqual(sampleGroup);
    });

    it('見つからない場合undefinedを返す', () => {
      vi.mocked(mockGroupRepo.getByName).mockReturnValue(undefined);
      expect(service.getGroupByName('unknown')).toBeUndefined();
    });
  });

  describe('createGroup', () => {
    it('新しいグループを作成する', () => {
      vi.mocked(mockGroupRepo.getByName).mockReturnValue(undefined);
      vi.mocked(mockGroupRepo.create).mockReturnValue(5);

      const result = service.createGroup('newGroup');
      expect(result).toBe(5);
      expect(mockGroupRepo.create).toHaveBeenCalledWith({ name: 'newGroup' });
    });

    it('既存のグループ名ならエラーを投げる', () => {
      expect(() => service.createGroup('testGroup')).toThrow('既に存在します');
    });
  });

  describe('deleteGroup', () => {
    it('グループを削除する', () => {
      const result = service.deleteGroup('testGroup');
      expect(result).toBe(true);
      expect(mockGroupRepo.deleteByName).toHaveBeenCalledWith('testGroup');
    });
  });

  describe('getItemsByGroupName', () => {
    it('グループのアイテム一覧を返す', () => {
      const result = service.getItemsByGroupName('testGroup');
      expect(result).toEqual(sampleItems);
    });
  });

  describe('getRandomItemFromGroup', () => {
    it('ランダムにアイテムを返す', () => {
      const result = service.getRandomItemFromGroup('testGroup');
      expect(['item1', 'item2', 'item3']).toContain(result);
    });

    it('アイテムが空ならundefinedを返す', () => {
      vi.mocked(mockGroupItemRepo.getAllByGroupName).mockReturnValue([]);
      expect(service.getRandomItemFromGroup('testGroup')).toBeUndefined();
    });
  });

  describe('getRandomItemFromGroupExcluding', () => {
    it('除外リスト以外からランダムに返す', () => {
      const result = service.getRandomItemFromGroupExcluding('testGroup', ['item1', 'item2']);
      expect(result).toBe('item3');
    });

    it('すべて除外されたらundefinedを返す', () => {
      const result = service.getRandomItemFromGroupExcluding('testGroup', [
        'item1',
        'item2',
        'item3',
      ]);
      expect(result).toBeUndefined();
    });

    it('アイテムが空ならundefinedを返す', () => {
      vi.mocked(mockGroupItemRepo.getAllByGroupName).mockReturnValue([]);
      expect(service.getRandomItemFromGroupExcluding('testGroup', [])).toBeUndefined();
    });
  });

  describe('addItemToGroup', () => {
    it('グループにアイテムを追加する', () => {
      vi.mocked(mockGroupItemRepo.create).mockReturnValue(10);
      const result = service.addItemToGroup('testGroup', 'newItem');
      expect(result).toBe(10);
      expect(mockGroupItemRepo.create).toHaveBeenCalledWith({
        groupId: 1,
        itemText: 'newItem',
      });
    });

    it('グループが存在しない場合undefinedを返す', () => {
      vi.mocked(mockGroupRepo.getByName).mockReturnValue(undefined);
      expect(service.addItemToGroup('unknown', 'item')).toBeUndefined();
    });
  });

  describe('addItemsToGroup', () => {
    it('複数アイテムをトランザクションで追加する', () => {
      vi.mocked(mockGroupItemRepo.create).mockReturnValueOnce(10).mockReturnValueOnce(11);

      const result = service.addItemsToGroup('testGroup', ['a', 'b']);
      expect(result).toEqual([10, 11]);
      expect(mockDb.transaction).toHaveBeenCalled();
    });

    it('グループが存在しない場合空配列を返す', () => {
      vi.mocked(mockGroupRepo.getByName).mockReturnValue(undefined);
      expect(service.addItemsToGroup('unknown', ['a'])).toEqual([]);
    });
  });

  describe('removeItemFromGroup', () => {
    it('アイテムを削除する', () => {
      const result = service.removeItemFromGroup('testGroup', 'item1');
      expect(result).toBe(true);
      expect(mockGroupItemRepo.deleteByGroupNameAndItemText).toHaveBeenCalledWith(
        'testGroup',
        'item1',
      );
    });
  });

  describe('clearGroupItems', () => {
    it('グループのアイテムをすべて削除する', () => {
      const result = service.clearGroupItems('testGroup');
      expect(result).toBe(true);
      expect(mockGroupItemRepo.deleteAllByGroupId).toHaveBeenCalledWith(1);
    });

    it('グループが存在しない場合falseを返す', () => {
      vi.mocked(mockGroupRepo.getByName).mockReturnValue(undefined);
      expect(service.clearGroupItems('unknown')).toBe(false);
    });
  });
});
