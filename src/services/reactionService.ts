import { ReactionMappingModel, ReactionMapping, CreateReactionMappingData } from '../models/reactionMapping';

/**
 * リアクション関連の処理を行うサービスクラス
 */
export class ReactionService {
  /**
   * メッセージテキストに対応するリアクションを取得する
   * @param messageText メッセージテキスト
   * @returns 対応するリアクションの配列
   */
  static getReactionsForMessage(messageText: string): string[] {
    // すべてのリアクションマッピングを取得
    const allMappings = ReactionMappingModel.getAll();
    
    // メッセージテキストに含まれるトリガーテキストに対応するリアクションを抽出
    const matchingReactions: string[] = [];
    
    allMappings.forEach((mapping) => {
      if (messageText.includes(mapping.triggerText)) {
        matchingReactions.push(mapping.reaction);
      }
    });
    
    // 重複を除去して返す
    return [...new Set(matchingReactions)];
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