import type Database from 'better-sqlite3';
import type { ReactionMapping } from '../models/reactionMapping';

export interface ReactionMappingRepository {
  getAll(): ReactionMapping[];
  create(triggerText: string, reaction: string): number;
  deleteByTriggerAndReaction(triggerText: string, reaction: string): boolean;
  incrementUsageCount(triggerText: string, reaction: string): boolean;
}

/**
 * SQLite上のリアクションマッピングを永続化する。
 */
export class SqliteReactionMappingRepository implements ReactionMappingRepository {
  constructor(private readonly db: Database.Database) {}

  getAll(): ReactionMapping[] {
    const statement = this.db.prepare(`
      SELECT
        id,
        trigger_text as triggerText,
        reaction,
        usage_count as usageCount,
        created_at as createdAt,
        updated_at as updatedAt
      FROM reaction_mappings
      ORDER BY id ASC
    `);

    return statement.all() as ReactionMapping[];
  }

  create(triggerText: string, reaction: string): number {
    const statement = this.db.prepare(`
      INSERT INTO reaction_mappings (trigger_text, reaction)
      VALUES (?, ?)
    `);
    const result = statement.run(triggerText, reaction);
    return result.lastInsertRowid as number;
  }

  deleteByTriggerAndReaction(triggerText: string, reaction: string): boolean {
    const statement = this.db.prepare(
      'DELETE FROM reaction_mappings WHERE trigger_text = ? AND reaction = ?',
    );
    return statement.run(triggerText, reaction).changes > 0;
  }

  incrementUsageCount(triggerText: string, reaction: string): boolean {
    const statement = this.db.prepare(`
      UPDATE reaction_mappings
      SET usage_count = usage_count + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE trigger_text = ? AND reaction = ?
    `);
    return statement.run(triggerText, reaction).changes > 0;
  }
}
