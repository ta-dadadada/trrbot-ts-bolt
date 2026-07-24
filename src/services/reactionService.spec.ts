import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactionMapping } from '../models/reactionMapping';
import type { ReactionMappingRepository } from '../repositories/sqliteReactionMappingRepository';
import { ReactionService } from './reactionService';

const repository = {
  getAll: vi.fn(),
  create: vi.fn(),
  deleteByTriggerAndReaction: vi.fn(),
  incrementUsageCount: vi.fn(),
} satisfies ReactionMappingRepository;

const mapping = (id: number, triggerText: string, reaction: string): ReactionMapping => ({
  id,
  triggerText,
  reaction,
  usageCount: 0,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
});

describe('ReactionService', () => {
  let service: ReactionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ReactionService(repository);
  });

  it('部分一致したマッピングをDB順で返す', () => {
    repository.getAll.mockReturnValue([
      mapping(1, 'hello', ':wave:'),
      mapping(2, 'world', ':smile:'),
      mapping(3, 'other', ':eyes:'),
    ]);

    expect(service.findMatchingMappings('hello world')).toEqual([
      mapping(1, 'hello', ':wave:'),
      mapping(2, 'world', ':smile:'),
    ]);
  });

  it('同じリアクションは最初に一致したマッピングだけを返す', () => {
    repository.getAll.mockReturnValue([
      mapping(1, 'hello', ':wave:'),
      mapping(2, 'world', ':wave:'),
    ]);

    expect(service.findMatchingMappings('hello world')).toEqual([mapping(1, 'hello', ':wave:')]);
  });

  it('一致しない場合は空配列を返す', () => {
    repository.getAll.mockReturnValue([mapping(1, 'hello', ':wave:')]);

    expect(service.findMatchingMappings('goodbye')).toEqual([]);
  });

  it('作成・削除・一覧・使用回数更新をRepositoryへ委譲する', () => {
    const mappings = [mapping(1, 'hello', ':wave:')];
    repository.create.mockReturnValue(42);
    repository.deleteByTriggerAndReaction.mockReturnValue(true);
    repository.getAll.mockReturnValue(mappings);
    repository.incrementUsageCount.mockReturnValue(false);

    expect(service.addReactionMapping('hello', ':wave:')).toBe(42);
    expect(service.removeReactionMapping('hello', ':wave:')).toBe(true);
    expect(service.getAllReactionMappings()).toBe(mappings);
    expect(service.incrementReactionUsage('hello', ':wave:')).toBe(false);
    expect(repository.create).toHaveBeenCalledWith('hello', ':wave:');
    expect(repository.deleteByTriggerAndReaction).toHaveBeenCalledWith('hello', ':wave:');
    expect(repository.incrementUsageCount).toHaveBeenCalledWith('hello', ':wave:');
  });
});
