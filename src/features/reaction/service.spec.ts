import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReactionService } from './service';
import type { IReactionMappingRepository } from './repository';
import type { ReactionMapping } from './entities';

describe('ReactionService', () => {
  let service: ReactionService;
  let mockRepo: IReactionMappingRepository;

  const sampleMappings: ReactionMapping[] = [
    {
      id: 1,
      triggerText: 'hello',
      reaction: ':wave:',
      usageCount: 5,
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
    {
      id: 2,
      triggerText: 'thanks',
      reaction: ':heart:',
      usageCount: 3,
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
    {
      id: 3,
      triggerText: 'hello',
      reaction: ':smile:',
      usageCount: 1,
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
  ];

  beforeEach(() => {
    mockRepo = {
      getAll: vi.fn().mockReturnValue(sampleMappings),
      getByTriggerText: vi.fn().mockReturnValue([]),
      create: vi.fn().mockReturnValue(1),
      delete: vi.fn().mockReturnValue(true),
      deleteByTriggerAndReaction: vi.fn().mockReturnValue(true),
      incrementUsageCount: vi.fn().mockReturnValue(true),
    };

    service = new ReactionService(mockRepo);
  });

  describe('getMatchingMappings', () => {
    it('メッセージに含まれるトリガーにマッチするマッピングを返す', () => {
      const result = service.getMatchingMappings('hello world');
      expect(result).toHaveLength(2);
      expect(result.map((m) => m.reaction)).toEqual([':wave:', ':smile:']);
    });

    it('複数のトリガーにマッチする場合すべて返す', () => {
      const result = service.getMatchingMappings('hello and thanks');
      expect(result).toHaveLength(3);
    });

    it('マッチしない場合空配列を返す', () => {
      const result = service.getMatchingMappings('no match here');
      expect(result).toHaveLength(0);
    });
  });

  describe('addReactionMapping', () => {
    it('新しいマッピングを追加する', () => {
      vi.mocked(mockRepo.create).mockReturnValue(10);
      const result = service.addReactionMapping('goodbye', ':wave:');
      expect(result).toBe(10);
      expect(mockRepo.create).toHaveBeenCalledWith({
        triggerText: 'goodbye',
        reaction: ':wave:',
      });
    });
  });

  describe('removeReactionMapping', () => {
    it('マッピングを削除する', () => {
      const result = service.removeReactionMapping('hello', ':wave:');
      expect(result).toBe(true);
      expect(mockRepo.deleteByTriggerAndReaction).toHaveBeenCalledWith('hello', ':wave:');
    });

    it('存在しないマッピングの削除でfalseを返す', () => {
      vi.mocked(mockRepo.deleteByTriggerAndReaction).mockReturnValue(false);
      expect(service.removeReactionMapping('unknown', ':x:')).toBe(false);
    });
  });

  describe('getAllReactionMappings', () => {
    it('すべてのマッピングを返す', () => {
      const result = service.getAllReactionMappings();
      expect(result).toEqual(sampleMappings);
    });
  });

  describe('incrementReactionUsage', () => {
    it('使用回数をインクリメントする', () => {
      const result = service.incrementReactionUsage('hello', ':wave:');
      expect(result).toBe(true);
      expect(mockRepo.incrementUsageCount).toHaveBeenCalledWith('hello', ':wave:');
    });
  });
});
