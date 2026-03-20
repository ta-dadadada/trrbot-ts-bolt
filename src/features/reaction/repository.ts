import type Database from 'better-sqlite3';
import type { ReactionMapping, CreateReactionMappingData } from './entities';

/**
 * リアクションマッピングリポジトリのインターフェース
 */
export interface IReactionMappingRepository {
  getAll(): ReactionMapping[];
  getByTriggerText(triggerText: string): ReactionMapping[];
  create(data: CreateReactionMappingData): number;
  delete(id: number): boolean;
  deleteByTriggerAndReaction(triggerText: string, reaction: string): boolean;
  incrementUsageCount(triggerText: string, reaction: string): boolean;
}

/**
 * リアクションマッピングリポジトリの実装
 */
export class ReactionMappingRepository implements IReactionMappingRepository {
  constructor(private readonly db: Database.Database) {}

  getAll(): ReactionMapping[] {
    const stmt = this.db.prepare(`
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

  getByTriggerText(triggerText: string): ReactionMapping[] {
    const stmt = this.db.prepare(`
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

  create(data: CreateReactionMappingData): number {
    const stmt = this.db.prepare(`
      INSERT INTO reaction_mappings (trigger_text, reaction)
      VALUES (?, ?)
    `);

    const result = stmt.run(data.triggerText, data.reaction);
    return result.lastInsertRowid as number;
  }

  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM reaction_mappings WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  deleteByTriggerAndReaction(triggerText: string, reaction: string): boolean {
    const stmt = this.db.prepare(
      'DELETE FROM reaction_mappings WHERE trigger_text = ? AND reaction = ?',
    );
    const result = stmt.run(triggerText, reaction);
    return result.changes > 0;
  }

  incrementUsageCount(triggerText: string, reaction: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE reaction_mappings
      SET usage_count = usage_count + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE trigger_text = ? AND reaction = ?
    `);

    const result = stmt.run(triggerText, reaction);
    return result.changes > 0;
  }
}
