import type { ReactionMapping } from '../models/reactionMapping';
import type { ReactionMappingRepository } from '../repositories/sqliteReactionMappingRepository';

/**
 * Reaction系のCommandとHandlerが利用するユースケース。
 */
export interface ReactionOperations {
  findMatchingMappings(messageText: string): ReactionMapping[];
  addReactionMapping(triggerText: string, reaction: string): number;
  removeReactionMapping(triggerText: string, reaction: string): boolean;
  getAllReactionMappings(): ReactionMapping[];
  incrementReactionUsage(triggerText: string, reaction: string): boolean;
}

/**
 * リアクション関連のユースケースを提供する。
 */
export class ReactionService implements ReactionOperations {
  constructor(private readonly repository: ReactionMappingRepository) {}

  findMatchingMappings(messageText: string): ReactionMapping[] {
    const allMappings = this.repository.getAll();
    const seenReactions = new Set<string>();
    const matchingMappings: ReactionMapping[] = [];

    for (const mapping of allMappings) {
      if (!messageText.includes(mapping.triggerText) || seenReactions.has(mapping.reaction)) {
        continue;
      }

      seenReactions.add(mapping.reaction);
      matchingMappings.push(mapping);
    }

    return matchingMappings;
  }

  addReactionMapping(triggerText: string, reaction: string): number {
    return this.repository.create(triggerText, reaction);
  }

  removeReactionMapping(triggerText: string, reaction: string): boolean {
    return this.repository.deleteByTriggerAndReaction(triggerText, reaction);
  }

  getAllReactionMappings(): ReactionMapping[] {
    return this.repository.getAll();
  }

  incrementReactionUsage(triggerText: string, reaction: string): boolean {
    return this.repository.incrementUsageCount(triggerText, reaction);
  }
}
