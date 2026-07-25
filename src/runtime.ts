import type { App } from '@slack/bolt';
import type Database from 'better-sqlite3';
import { createCommandRegistry } from './commands';
import { createCommandRouter } from './commands/router';
import { closeDatabase } from './db/connection';
import { initializeSchema } from './db/schema';
import { registerMessageHandlers } from './handlers/messageHandler';
import { registerMentionHandlers } from './handlers/mentionHandler';
import { SqliteGroupRepository } from './repositories/sqliteGroupRepository';
import { SqliteReactionMappingRepository } from './repositories/sqliteReactionMappingRepository';
import { GroupService, type RandomItemPicker } from './services/groupService';
import { ReactionService } from './services/reactionService';

export interface ApplicationRuntimeDependencies {
  app: App;
  db: Database.Database;
  pickRandomItem: RandomItemPicker;
}

export interface ApplicationRuntime {
  start(port: number): Promise<void>;
  stop(): Promise<void>;
}

/**
 * アプリケーションの依存関係を組み立て、所有するリソースのライフサイクルを管理する。
 */
export function createApplicationRuntime(
  dependencies: ApplicationRuntimeDependencies,
): ApplicationRuntime {
  const { app, db, pickRandomItem } = dependencies;
  let started = false;
  let stopPromise: Promise<void> | undefined;

  const stop = (): Promise<void> => {
    if (stopPromise === undefined) {
      stopPromise = (async () => {
        try {
          if (started) {
            await app.stop();
          }
        } finally {
          closeDatabase(db);
        }
      })();
    }

    return stopPromise;
  };

  try {
    initializeSchema(db);

    const groupService = new GroupService(new SqliteGroupRepository(db), pickRandomItem);
    const reactionService = new ReactionService(new SqliteReactionMappingRepository(db));
    const commandRegistry = createCommandRegistry({ groupService, reactionService });
    const processCommand = createCommandRouter(commandRegistry.resolveCommand);

    registerMessageHandlers(app, { processCommand, reactionService });
    registerMentionHandlers(app, { processCommand });
  } catch (error) {
    closeDatabase(db);
    throw error;
  }

  return {
    async start(port: number): Promise<void> {
      try {
        await app.start(port);
        started = true;
      } catch (error) {
        await stop();
        throw error;
      }
    },
    stop,
  };
}
