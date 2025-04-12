import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GroupService } from './groupService';
import { GroupModel, GroupItemModel } from '../models/group';
import db from '../config/database';

// GroupModelとGroupItemModelのモック
vi.mock('../models/group', () => {
  return {
    GroupModel: {
      getAll: vi.fn(),
      getByName: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteByName: vi.fn(),
    },
    GroupItemModel: {
      getAllByGroupId: vi.fn(),
      getAllByGroupName: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteAllByGroupId: vi.fn(),
      deleteByGroupNameAndItemText: vi.fn(),
    },
  };
});

// データベースのモック
vi.mock('../config/database', () => {
  const mockDb = {
    transaction: vi.fn().mockImplementation((fn) => {
      return () => fn();
    }),
  };
  return { default: mockDb };
});

// getRandomItemのモック
vi.mock('../utils/random', () => {
  return {
    getRandomItem: vi.fn(),
  };
});

describe('GroupService', () => {
  beforeEach(() => {
    // モックをリセット
    vi.clearAllMocks();
  });

  describe('addItemToGroup', () => {
    it('グループが存在しない場合はundefinedを返すこと', () => {
      // GroupModel.getByNameがundefinedを返すようにモック
      vi.mocked(GroupModel.getByName).mockReturnValue(undefined);

      // メソッドを実行
      const result = GroupService.addItemToGroup('存在しないグループ', 'アイテム');

      // 期待する結果を検証
      expect(GroupModel.getByName).toHaveBeenCalledWith('存在しないグループ');
      expect(GroupItemModel.create).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('グループが存在する場合はアイテムを追加してIDを返すこと', () => {
      // GroupModel.getByNameがグループを返すようにモック
      vi.mocked(GroupModel.getByName).mockReturnValue({
        id: 1,
        name: 'テストグループ',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
      });

      // GroupItemModel.createが1を返すようにモック
      vi.mocked(GroupItemModel.create).mockReturnValue(1);

      // メソッドを実行
      const result = GroupService.addItemToGroup('テストグループ', 'アイテム');

      // 期待する結果を検証
      expect(GroupModel.getByName).toHaveBeenCalledWith('テストグループ');
      expect(GroupItemModel.create).toHaveBeenCalledWith({
        groupId: 1,
        itemText: 'アイテム',
      });
      expect(result).toBe(1);
    });

    it('ユーザーメンションを含むアイテムを追加できること', () => {
      // GroupModel.getByNameがグループを返すようにモック
      vi.mocked(GroupModel.getByName).mockReturnValue({
        id: 1,
        name: 'テストグループ',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
      });

      // GroupItemModel.createが1を返すようにモック
      vi.mocked(GroupItemModel.create).mockReturnValue(1);

      // メソッドを実行
      const result = GroupService.addItemToGroup('テストグループ', '<@U1234567>');

      // 期待する結果を検証
      expect(GroupModel.getByName).toHaveBeenCalledWith('テストグループ');
      expect(GroupItemModel.create).toHaveBeenCalledWith({
        groupId: 1,
        itemText: '<@U1234567>',
      });
      expect(result).toBe(1);
    });
  });

  describe('addItemsToGroup', () => {
    it('グループが存在しない場合は空配列を返すこと', () => {
      // GroupModel.getByNameがundefinedを返すようにモック
      vi.mocked(GroupModel.getByName).mockReturnValue(undefined);

      // メソッドを実行
      const result = GroupService.addItemsToGroup('存在しないグループ', ['アイテム1', 'アイテム2']);

      // 期待する結果を検証
      expect(GroupModel.getByName).toHaveBeenCalledWith('存在しないグループ');
      expect(db.transaction).not.toHaveBeenCalled();
      expect(GroupItemModel.create).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('グループが存在する場合は複数のアイテムを追加してID配列を返すこと', () => {
      // GroupModel.getByNameがグループを返すようにモック
      vi.mocked(GroupModel.getByName).mockReturnValue({
        id: 1,
        name: 'テストグループ',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
      });

      // GroupItemModel.createが連番を返すようにモック
      vi.mocked(GroupItemModel.create)
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(2)
        .mockReturnValueOnce(3);

      // メソッドを実行
      const result = GroupService.addItemsToGroup('テストグループ', ['アイテム1', 'アイテム2', 'アイテム3']);

      // 期待する結果を検証
      expect(GroupModel.getByName).toHaveBeenCalledWith('テストグループ');
      expect(db.transaction).toHaveBeenCalled();
      expect(GroupItemModel.create).toHaveBeenCalledTimes(3);
      expect(GroupItemModel.create).toHaveBeenNthCalledWith(1, {
        groupId: 1,
        itemText: 'アイテム1',
      });
      expect(GroupItemModel.create).toHaveBeenNthCalledWith(2, {
        groupId: 1,
        itemText: 'アイテム2',
      });
      expect(GroupItemModel.create).toHaveBeenNthCalledWith(3, {
        groupId: 1,
        itemText: 'アイテム3',
      });
      expect(result).toEqual([1, 2, 3]);
    });

    it('ユーザーメンションを含む複数のアイテムを追加できること', () => {
      // GroupModel.getByNameがグループを返すようにモック
      vi.mocked(GroupModel.getByName).mockReturnValue({
        id: 1,
        name: 'テストグループ',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
      });

      // GroupItemModel.createが連番を返すようにモック
      vi.mocked(GroupItemModel.create)
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(2);

      // メソッドを実行
      const result = GroupService.addItemsToGroup('テストグループ', ['<@U1234567>', '<@U7654321>']);

      // 期待する結果を検証
      expect(GroupModel.getByName).toHaveBeenCalledWith('テストグループ');
      expect(db.transaction).toHaveBeenCalled();
      expect(GroupItemModel.create).toHaveBeenCalledTimes(2);
      expect(GroupItemModel.create).toHaveBeenNthCalledWith(1, {
        groupId: 1,
        itemText: '<@U1234567>',
      });
      expect(GroupItemModel.create).toHaveBeenNthCalledWith(2, {
        groupId: 1,
        itemText: '<@U7654321>',
      });
      expect(result).toEqual([1, 2]);
    });

    it('空の配列が渡された場合は空の配列を返すこと', () => {
      // GroupModel.getByNameがグループを返すようにモック
      vi.mocked(GroupModel.getByName).mockReturnValue({
        id: 1,
        name: 'テストグループ',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
      });

      // メソッドを実行
      const result = GroupService.addItemsToGroup('テストグループ', []);

      // 期待する結果を検証
      expect(GroupModel.getByName).toHaveBeenCalledWith('テストグループ');
      expect(db.transaction).toHaveBeenCalled();
      expect(GroupItemModel.create).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});