import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReactionMappingModel, type ReactionMapping } from '../models/reactionMapping';
import { ReactionService } from './reactionService';

vi.mock('../models/reactionMapping', () => ({
  ReactionMappingModel: {
    getAll: vi.fn(),
    create: vi.fn(),
    deleteByTriggerAndReaction: vi.fn(),
    incrementUsageCount: vi.fn(),
  },
}));

const mapping = (id: number, triggerText: string, reaction: string): ReactionMapping => ({
  id,
  triggerText,
  reaction,
  usageCount: 0,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
});

describe('ReactionService.findMatchingMappings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('部分一致したマッピングをDB順で返す', () => {
    vi.mocked(ReactionMappingModel.getAll).mockReturnValue([
      mapping(1, 'hello', ':wave:'),
      mapping(2, 'world', ':smile:'),
      mapping(3, 'other', ':eyes:'),
    ]);

    expect(ReactionService.findMatchingMappings('hello world')).toEqual([
      mapping(1, 'hello', ':wave:'),
      mapping(2, 'world', ':smile:'),
    ]);
  });

  it('同じリアクションは最初に一致したマッピングだけを返す', () => {
    vi.mocked(ReactionMappingModel.getAll).mockReturnValue([
      mapping(1, 'hello', ':wave:'),
      mapping(2, 'world', ':wave:'),
    ]);

    expect(ReactionService.findMatchingMappings('hello world')).toEqual([
      mapping(1, 'hello', ':wave:'),
    ]);
  });

  it('一致しない場合は空配列を返す', () => {
    vi.mocked(ReactionMappingModel.getAll).mockReturnValue([mapping(1, 'hello', ':wave:')]);

    expect(ReactionService.findMatchingMappings('goodbye')).toEqual([]);
  });

  it('addReactionMappingは作成データをModelへ渡し戻り値を返す', () => {
    vi.mocked(ReactionMappingModel.create).mockReturnValue(42);

    expect(ReactionService.addReactionMapping('hello', ':wave:')).toBe(42);
    expect(ReactionMappingModel.create).toHaveBeenCalledWith({
      triggerText: 'hello',
      reaction: ':wave:',
    });
  });

  it('removeReactionMappingは引数をModelへ渡し戻り値を返す', () => {
    vi.mocked(ReactionMappingModel.deleteByTriggerAndReaction).mockReturnValue(true);

    expect(ReactionService.removeReactionMapping('hello', ':wave:')).toBe(true);
    expect(ReactionMappingModel.deleteByTriggerAndReaction).toHaveBeenCalledWith('hello', ':wave:');
  });

  it('getAllReactionMappingsはModelの戻り値をそのまま返す', () => {
    const mappings = [mapping(1, 'hello', ':wave:')];
    vi.mocked(ReactionMappingModel.getAll).mockReturnValue(mappings);

    expect(ReactionService.getAllReactionMappings()).toBe(mappings);
    expect(ReactionMappingModel.getAll).toHaveBeenCalledWith();
  });

  it('incrementReactionUsageは引数をModelへ渡し戻り値を返す', () => {
    vi.mocked(ReactionMappingModel.incrementUsageCount).mockReturnValue(false);

    expect(ReactionService.incrementReactionUsage('hello', ':wave:')).toBe(false);
    expect(ReactionMappingModel.incrementUsageCount).toHaveBeenCalledWith('hello', ':wave:');
  });
});
