import db from '../config/database';

/**
 * リアクションマッピングの型定義
 */
export interface ReactionMapping {
  id: number;
  triggerText: string;
  reaction: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * リアクションマッピングの作成用データの型定義
 */
export interface CreateReactionMappingData {
  triggerText: string;
  reaction: string;
}

/**
 * リアクションマッピングの操作を行うクラス
 */
export class ReactionMappingModel {
  /**
   * すべてのリアクションマッピングを取得する
   * @returns リアクションマッピングの配列
   */
  static getAll(): ReactionMapping[] {
    const stmt = db.prepare(`
      SELECT
        id,
        trigger_text as triggerText,
        reaction,
        usage_count as usageCount,
        created_at as createdAt,
        updated_at as updatedAt
      FROM reaction_mappings
    `);
    
    return stmt.all() as ReactionMapping[];
  }

  /**
   * 指定されたトリガーテキストに一致するリアクションマッピングを取得する
   * @param triggerText トリガーテキスト
   * @returns リアクションマッピングの配列
   */
  static getByTriggerText(triggerText: string): ReactionMapping[] {
    const stmt = db.prepare(`
      SELECT
        id,
        trigger_text as triggerText,
        reaction,
        usage_count as usageCount,
        created_at as createdAt,
        updated_at as updatedAt
      FROM reaction_mappings
      WHERE trigger_text = ?
    `);
    
    return stmt.all(triggerText) as ReactionMapping[];
  }

  /**
   * 新しいリアクションマッピングを作成する
   * @param data 作成するリアクションマッピングのデータ
   * @returns 作成されたリアクションマッピングのID
   */
  static create(data: CreateReactionMappingData): number {
    const stmt = db.prepare(`
      INSERT INTO reaction_mappings (trigger_text, reaction)
      VALUES (?, ?)
    `);
    
    const result = stmt.run(data.triggerText, data.reaction);
    return result.lastInsertRowid as number;
  }

  /**
   * 指定されたIDのリアクションマッピングを削除する
   * @param id 削除するリアクションマッピングのID
   * @returns 削除に成功した場合はtrue、失敗した場合はfalse
   */
  static delete(id: number): boolean {
    const stmt = db.prepare('DELETE FROM reaction_mappings WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * 指定されたトリガーテキストとリアクションのリアクションマッピングを削除する
   * @param triggerText トリガーテキスト
   * @param reaction リアクション
   * @returns 削除に成功した場合はtrue、失敗した場合はfalse
   */
  static deleteByTriggerAndReaction(triggerText: string, reaction: string): boolean {
    const stmt = db.prepare('DELETE FROM reaction_mappings WHERE trigger_text = ? AND reaction = ?');
    const result = stmt.run(triggerText, reaction);
    return result.changes > 0;
  }

  /**
   * 指定されたトリガーテキストとリアクションのリアクションマッピングの使用回数をインクリメントする
   * @param triggerText トリガーテキスト
   * @param reaction リアクション
   * @returns 更新に成功した場合はtrue、失敗した場合はfalse
   */
  static incrementUsageCount(triggerText: string, reaction: string): boolean {
    const stmt = db.prepare(`
      UPDATE reaction_mappings
      SET usage_count = usage_count + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE trigger_text = ? AND reaction = ?
    `);
    
    const result = stmt.run(triggerText, reaction);
    return result.changes > 0;
  }
}