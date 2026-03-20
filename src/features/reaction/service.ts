import type { ReactionMapping, CreateReactionMappingData } from './entities';
import type { IReactionMappingRepository } from './repository';

/**
 * リアクションサービスのインターフェース
 */
export interface IReactionService {
  getMatchingMappings(messageText: string): ReactionMapping[];
  addReactionMapping(triggerText: string, reaction: string): number;
  removeReactionMapping(triggerText: string, reaction: string): boolean;
  getAllReactionMappings(): ReactionMapping[];
  incrementReactionUsage(triggerText: string, reaction: string): boolean;
}

/**
 * リアクション関連の処理を行うサービスクラス
 */
export class ReactionService implements IReactionService {
  constructor(private readonly reactionMappingRepository: IReactionMappingRepository) {}

  /**
   * メッセージテキストにマッチするリアクションマッピングを取得する
   */
  getMatchingMappings(messageText: string): ReactionMapping[] {
    const allMappings = this.reactionMappingRepository.getAll();
    return allMappings.filter((mapping) => messageText.includes(mapping.triggerText));
  }

  /**
   * 新しいリアクションマッピングを追加する
   */
  addReactionMapping(triggerText: string, reaction: string): number {
    const data: CreateReactionMappingData = {
      triggerText,
      reaction,
    };

    return this.reactionMappingRepository.create(data);
  }

  /**
   * リアクションマッピングを削除する
   */
  removeReactionMapping(triggerText: string, reaction: string): boolean {
    return this.reactionMappingRepository.deleteByTriggerAndReaction(triggerText, reaction);
  }

  /**
   * すべてのリアクションマッピングを取得する
   */
  getAllReactionMappings(): ReactionMapping[] {
    return this.reactionMappingRepository.getAll();
  }

  /**
   * リアクションの使用回数をインクリメントする
   */
  incrementReactionUsage(triggerText: string, reaction: string): boolean {
    return this.reactionMappingRepository.incrementUsageCount(triggerText, reaction);
  }
}
