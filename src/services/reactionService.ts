import {
  ReactionMappingModel,
  ReactionMapping,
  CreateReactionMappingData,
} from '../models/reactionMapping';

/**
 * リアクション関連の処理を行うサービスクラス
 */
export class ReactionService {
  /**
   * メッセージに一致したマッピングをリアクションごとに1件返す
   * @param messageText メッセージテキスト
   * @returns DB順で最初に一致した一意なリアクションのマッピング
   */
  static findMatchingMappings(messageText: string): ReactionMapping[] {
    const allMappings = ReactionMappingModel.getAll();

    const seenReactions = new Set<string>();
    const matchingMappings: ReactionMapping[] = [];

    for (const mapping of allMappings) {
      if (messageText.includes(mapping.triggerText) && !seenReactions.has(mapping.reaction)) {
        seenReactions.add(mapping.reaction);
        matchingMappings.push(mapping);
      }
    }

    return matchingMappings;
  }

  /**
   * 新しいリアクションマッピングを追加する
   * @param triggerText トリガーテキスト
   * @param reaction リアクション
   * @returns 作成されたリアクションマッピングのID
   */
  static addReactionMapping(triggerText: string, reaction: string): number {
    const data: CreateReactionMappingData = {
      triggerText,
      reaction,
    };

    return ReactionMappingModel.create(data);
  }

  /**
   * リアクションマッピングを削除する
   * @param triggerText トリガーテキスト
   * @param reaction リアクション
   * @returns 削除に成功した場合はtrue、失敗した場合はfalse
   */
  static removeReactionMapping(triggerText: string, reaction: string): boolean {
    return ReactionMappingModel.deleteByTriggerAndReaction(triggerText, reaction);
  }

  /**
   * すべてのリアクションマッピングを取得する
   * @returns リアクションマッピングの配列
   */
  static getAllReactionMappings(): ReactionMapping[] {
    return ReactionMappingModel.getAll();
  }

  /**
   * リアクションの使用回数をインクリメントする
   * @param triggerText トリガーテキスト
   * @param reaction リアクション
   * @returns 更新に成功した場合はtrue、失敗した場合はfalse
   */
  static incrementReactionUsage(triggerText: string, reaction: string): boolean {
    return ReactionMappingModel.incrementUsageCount(triggerText, reaction);
  }
}
