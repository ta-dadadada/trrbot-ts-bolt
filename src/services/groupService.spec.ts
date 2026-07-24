import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GroupItem } from '../models/group';
import type { GroupRepository } from '../repositories/sqliteGroupRepository';
import { GroupService, type RandomItemPicker } from './groupService';

const repository = {
  getAllGroups: vi.fn(),
  getGroupByName: vi.fn(),
  createGroup: vi.fn(),
  deleteGroupByName: vi.fn(),
  getItemsByGroupName: vi.fn(),
  createItem: vi.fn(),
  createItems: vi.fn(),
  deleteAllItemsByGroupId: vi.fn(),
  deleteItemByGroupNameAndText: vi.fn(),
} satisfies GroupRepository;

const pickRandomItemMock = vi.fn();
const pickRandomItem: RandomItemPicker = <T>(items: T[]): T | undefined =>
  pickRandomItemMock(items) as T | undefined;

const group = {
  id: 1,
  name: '昼食',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

const item = (itemText: string): GroupItem => ({
  id: 1,
  groupId: group.id,
  itemText,
  createdAt: '2026-01-01',
});

describe('GroupService', () => {
  let service: GroupService;

  beforeEach(() => {
    vi.clearAllMocks();
    pickRandomItemMock.mockImplementation((items: unknown[]) => items[0]);
    service = new GroupService(repository, pickRandomItem);
  });

  it('一覧・削除・アイテム取得をRepositoryへ委譲する', () => {
    repository.getAllGroups.mockReturnValue([group]);
    repository.deleteGroupByName.mockReturnValue(true);
    repository.getItemsByGroupName.mockReturnValue([item('ラーメン')]);

    expect(service.getAllGroups()).toEqual([group]);
    expect(service.deleteGroup('昼食')).toBe(true);
    expect(service.getItemsByGroupName('昼食')).toEqual([item('ラーメン')]);
    expect(repository.deleteGroupByName).toHaveBeenCalledWith('昼食');
  });

  it('重複しないグループを作成し、重複時は拒否する', () => {
    repository.getGroupByName.mockReturnValueOnce(undefined).mockReturnValueOnce(group);
    repository.createGroup.mockReturnValue(10);

    expect(service.createGroup('夕食')).toBe(10);
    expect(repository.createGroup).toHaveBeenCalledWith('夕食');
    expect(() => service.createGroup('昼食')).toThrow('既に存在します');
  });

  it('存在するグループへ単一アイテムを追加する', () => {
    repository.getGroupByName.mockReturnValue(group);
    repository.createItem.mockReturnValue(20);

    expect(service.addItemToGroup('昼食', 'ラーメン')).toBe(20);
    expect(repository.createItem).toHaveBeenCalledWith(group.id, 'ラーメン');
  });

  it('存在しないグループへの単一追加はundefinedを返す', () => {
    repository.getGroupByName.mockReturnValue(undefined);

    expect(service.addItemToGroup('存在しない', 'ラーメン')).toBeUndefined();
    expect(repository.createItem).not.toHaveBeenCalled();
  });

  it('複数アイテムの原子的一括追加をRepositoryへ委譲する', () => {
    repository.getGroupByName.mockReturnValue(group);
    repository.createItems.mockReturnValue([20, 21]);

    expect(service.addItemsToGroup('昼食', ['ラーメン', '<@U123>'])).toEqual([20, 21]);
    expect(repository.createItems).toHaveBeenCalledWith(group.id, ['ラーメン', '<@U123>']);
  });

  it('存在しないグループへの一括追加は空配列を返す', () => {
    repository.getGroupByName.mockReturnValue(undefined);

    expect(service.addItemsToGroup('存在しない', ['ラーメン'])).toEqual([]);
    expect(repository.createItems).not.toHaveBeenCalled();
  });

  it('グループからランダムにアイテムを選ぶ', () => {
    const items = [item('ラーメン'), item('うどん')];
    repository.getItemsByGroupName.mockReturnValue(items);
    pickRandomItemMock.mockReturnValue(items[1]);

    expect(service.getRandomItemFromGroup('昼食')).toBe('うどん');
    expect(pickRandomItemMock).toHaveBeenCalledWith(items);
  });

  it('除外後の候補だけからランダムにアイテムを選ぶ', () => {
    repository.getItemsByGroupName.mockReturnValue([item('ラーメン'), item('うどん')]);

    expect(service.getRandomItemFromGroupExcluding('昼食', ['ラーメン'])).toBe('うどん');
    expect(pickRandomItemMock).toHaveBeenCalledWith([item('うどん')]);
  });

  it('候補が空の場合はundefinedを返す', () => {
    repository.getItemsByGroupName.mockReturnValue([item('ラーメン')]);

    expect(service.getRandomItemFromGroupExcluding('昼食', ['ラーメン'])).toBeUndefined();
    expect(pickRandomItemMock).not.toHaveBeenCalled();
  });

  it('アイテム削除と全削除をRepositoryへ委譲する', () => {
    repository.deleteItemByGroupNameAndText.mockReturnValue(true);
    repository.getGroupByName.mockReturnValue(group);
    repository.deleteAllItemsByGroupId.mockReturnValue(true);

    expect(service.removeItemFromGroup('昼食', 'ラーメン')).toBe(true);
    expect(service.clearGroupItems('昼食')).toBe(true);
    expect(repository.deleteItemByGroupNameAndText).toHaveBeenCalledWith('昼食', 'ラーメン');
    expect(repository.deleteAllItemsByGroupId).toHaveBeenCalledWith(group.id);
  });

  it('存在しないグループの全削除はfalseを返す', () => {
    repository.getGroupByName.mockReturnValue(undefined);

    expect(service.clearGroupItems('存在しない')).toBe(false);
    expect(repository.deleteAllItemsByGroupId).not.toHaveBeenCalled();
  });
});
