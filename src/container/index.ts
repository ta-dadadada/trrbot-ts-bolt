import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { container, TOKENS } from './ServiceContainer';
import {
  GroupRepository,
  GroupItemRepository,
  GroupService,
  type IGroupRepository,
  type IGroupItemRepository,
  type IGroupService,
} from '../features/group';
import {
  ReactionMappingRepository,
  ReactionService,
  type IReactionMappingRepository,
  type IReactionService,
} from '../features/reaction';

export { container, TOKENS, ServiceContainer } from './ServiceContainer';
export type { Token } from './ServiceContainer';

/**
 * データベースインスタンスを作成する
 */
export function createDatabase(dbPath?: string): Database.Database {
  const resolvedDbPath = dbPath ?? path.join(process.cwd(), 'data', 'trrbot.db');
  const dbDir = path.dirname(resolvedDbPath);
  fs.mkdirSync(dbDir, { recursive: true });

  const db = new Database(resolvedDbPath);
  db.pragma('foreign_keys = ON');

  return db;
}

/**
 * DIコンテナを初期化する
 */
export function initializeContainer(db: Database.Database): void {
  // Database
  container.registerInstance(TOKENS.Database, db);

  // Repositories
  container.registerFactory(TOKENS.GroupRepository, () => new GroupRepository(db));

  container.registerFactory(TOKENS.GroupItemRepository, () => {
    const groupRepository = container.resolve<IGroupRepository>(TOKENS.GroupRepository);
    return new GroupItemRepository(db, groupRepository);
  });

  container.registerFactory(
    TOKENS.ReactionMappingRepository,
    () => new ReactionMappingRepository(db),
  );

  // Services
  container.registerFactory(TOKENS.GroupService, () => {
    const groupRepository = container.resolve<IGroupRepository>(TOKENS.GroupRepository);
    const groupItemRepository = container.resolve<IGroupItemRepository>(TOKENS.GroupItemRepository);
    return new GroupService(db, groupRepository, groupItemRepository);
  });

  container.registerFactory(TOKENS.ReactionService, () => {
    const reactionMappingRepository = container.resolve<IReactionMappingRepository>(
      TOKENS.ReactionMappingRepository,
    );
    return new ReactionService(reactionMappingRepository);
  });
}

/**
 * Type-safe resolver helpers
 */
export function resolveGroupService(): IGroupService {
  return container.resolve<IGroupService>(TOKENS.GroupService);
}

export function resolveReactionService(): IReactionService {
  return container.resolve<IReactionService>(TOKENS.ReactionService);
}

export function resolveDatabase(): Database.Database {
  return container.resolve<Database.Database>(TOKENS.Database);
}
