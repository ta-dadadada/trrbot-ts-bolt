/**
 * Dependency injection tokens
 */
export const TOKENS = {
  Database: Symbol('Database'),
  GroupRepository: Symbol('GroupRepository'),
  GroupItemRepository: Symbol('GroupItemRepository'),
  ReactionMappingRepository: Symbol('ReactionMappingRepository'),
  GroupService: Symbol('GroupService'),
  ReactionService: Symbol('ReactionService'),
} as const;

export type Token = (typeof TOKENS)[keyof typeof TOKENS];

/**
 * Simple dependency injection container
 *
 * Type safety is achieved at the call site using the typed helper functions
 * in container/index.ts rather than through complex generic constraints.
 */
export class ServiceContainer {
  private instances = new Map<symbol, unknown>();
  private factories = new Map<symbol, () => unknown>();

  /**
   * Register a singleton instance
   */
  registerInstance<T>(token: symbol, instance: T): void {
    this.instances.set(token, instance);
  }

  /**
   * Register a factory function for lazy instantiation
   */
  registerFactory<T>(token: symbol, factory: () => T): void {
    this.factories.set(token, factory);
  }

  /**
   * Resolve a dependency by token
   */
  resolve<T>(token: symbol): T {
    // Check for existing instance
    if (this.instances.has(token)) {
      return this.instances.get(token) as T;
    }

    // Check for factory
    const factory = this.factories.get(token);
    if (factory) {
      const instance = factory() as T;
      this.instances.set(token, instance); // Cache as singleton
      return instance;
    }

    throw new Error(`No registration found for token: ${token.toString()}`);
  }

  /**
   * Check if a token is registered
   */
  has(token: symbol): boolean {
    return this.instances.has(token) || this.factories.has(token);
  }

  /**
   * Clear all registrations (useful for testing)
   */
  clear(): void {
    this.instances.clear();
    this.factories.clear();
  }
}

/**
 * Global container instance
 */
export const container = new ServiceContainer();
