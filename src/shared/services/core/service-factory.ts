/**
 * @fileoverview Service Factory Manager
 * @description Specialized manager for service factory registration, caching,
 * and lazy instance creation. Handles factory function storage with memoization
 * to prevent redundant instantiation.
 *
 * **Responsibility**: Factory management and caching only (Single Responsibility)
 *
 * **Pattern**: Singleton factories are created and cached on first request.
 * Subsequent requests for the same factory key return cached instance.
 *
 * **Phase Reference**: Phase 309 Service Layer Pattern, Phase 380 Optimization
 *
 * @version 1.0.0 - Service Manager Delegation Pattern (Factory Specialization)
 */

import { logger } from '../../logging';

/**
 * Specialized factory manager for service instantiation
 *
 * **Responsibilities**:
 * - Register service factory functions
 * - Create instances from factories (with caching)
 * - Query registered factory availability
 * - Reset for testing purposes
 *
 * **Separation of Concerns**: Delegates direct instance storage to
 * {@link ServiceRegistry}. This class manages only factory functions
 * and their cached instances.
 *
 * @public
 */
export class ServiceFactoryManager {
  private readonly factories = new Map<string, () => unknown>();
  private readonly factoryCache = new Map<string, unknown>();

  constructor() {
    logger.debug('[ServiceFactoryManager] Initialized');
  }

  /**
   * Register a service factory function
   *
   * If a factory with the same key already exists, logs warning and ignores.
   * Prevents factory overwriting during initialization sequence.
   *
   * @param {string} key - Unique factory identifier
   * @param {() => T} factory - Factory function (called on-demand for instantiation)
   *
   * @example
   * ```typescript
   * const manager = new ServiceFactoryManager();
   * manager.registerFactory('myService', () => new MyService());
   * ```
   *
   * @internal Phase 309: Factory functions registered during bootstrap
   */
  public registerFactory<T>(key: string, factory: () => T): void {
    if (this.factories.has(key)) {
      logger.warn(`[ServiceFactoryManager] Factory already registered (ignored): ${key}`);
      return;
    }
    this.factories.set(key, factory);
    logger.debug(`[ServiceFactoryManager] Factory registered: ${key}`);
  }

  /**
   * Create a service instance from registered factory (with caching)
   *
   * **Caching Strategy**: Once created, instances are cached. Subsequent requests
   * return the cached instance (Singleton behavior). This prevents multiple
   * instantiations of expensive-to-create services.
   *
   * @param {string} key - Factory identifier
   * @returns {T | null} Cached or newly created instance, or null if factory not found
   *
   * @throws {Error} If factory execution fails, error is logged and rethrown
   *
   * @example
   * ```typescript
   * const service = manager.createFromFactory<MyService>('myService');
   * if (service) {
   *   service.doSomething();
   * }
   * ```
   *
   * @internal Phase 309: Called by CoreService.get() when registry lookup fails
   */
  public createFromFactory<T>(key: string): T | null {
    if (this.factoryCache.has(key)) {
      return this.factoryCache.get(key) as T;
    }

    const factory = this.factories.get(key);
    if (!factory) {
      return null;
    }

    try {
      const created = factory();
      this.factoryCache.set(key, created);
      logger.debug(`[ServiceFactoryManager] Instance created from factory: ${key}`);
      return created as T;
    } catch (error) {
      logger.error(`[ServiceFactoryManager] Factory execution failed (${key}):`, error);
      throw error;
    }
  }

  /**
   * Check if factory is registered
   *
   * @param {string} key - Factory identifier
   * @returns {boolean} True if factory registered, false otherwise
   *
   * @internal Used by CoreService.has() for availability checking
   */
  public hasFactory(key: string): boolean {
    return this.factories.has(key);
  }

  /**
   * Get list of all registered factory keys
   *
   * **Diagnostics**: Useful for debugging and health checks
   *
   * @returns {string[]} Array of registered factory identifiers
   *
   * @example
   * ```typescript
   * console.log(manager.getRegisteredFactories()); // ['service1', 'service2']
   * ```
   */
  public getRegisteredFactories(): string[] {
    return Array.from(this.factories.keys());
  }

  /**
   * Reset all factories and cached instances (testing only)
   *
   * **Warning**: Clears all state. Use in test teardown only.
   *
   * @internal Phase 137: Test isolation - called by CoreService.reset()
   */
  public reset(): void {
    this.factories.clear();
    this.factoryCache.clear();
    logger.debug('[ServiceFactoryManager] All factories reset');
  }
}
