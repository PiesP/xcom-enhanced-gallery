/**
 * @fileoverview BaseService Lifecycle Manager
 * @description Specialized manager for BaseService registration, initialization,
 * and cleanup lifecycle. Handles async initialization sequences and state tracking
 * for services that implement the {@link BaseService} interface.
 *
 * **Responsibility**: BaseService lifecycle management only
 * (Single Responsibility Principle)
 *
 * **Pattern**: Tracks both registered services and initialization state.
 * Prevents duplicate initialization and enables selective initialization.
 *
 * **Phase Reference**: Phase 309 Service Layer Pattern, Phase 380 Optimization
 *
 * @version 1.0.0 - Service Manager Delegation Pattern (Lifecycle Specialization)
 */

import type { BaseService } from '@shared/types/core/base-service.types';

/**
 * Specialized lifecycle manager for BaseService instances
 *
 * **Responsibilities**:
 * - Register BaseService instances
 * - Initialize services with async support
 * - Track initialization state
 * - Cleanup/destroy services
 * - Reset for testing purposes
 *
 * **Separation of Concerns**: Delegates direct instance storage to
 * {@link ServiceRegistry}. This class manages only BaseService instances
 * and their initialization state machine.
 *
 * @public
 */
export class ServiceLifecycleManager {
  private readonly baseServices = new Map<string, BaseService>();
  private readonly initializedServices = new Set<string>();

  constructor() {}

  /**
   * Register a BaseService instance for lifecycle management
   *
   * **Overwrite Handling**: If service with same key exists, the previous
   * registration is replaced (last registration wins).
   *
   * @param {string} key - Unique service identifier
   * @param {BaseService} service - Service implementing BaseService interface
   *
   * @example
   * ```typescript
   * const manager = new ServiceLifecycleManager();
   * const service = new MyService();
   * manager.registerBaseService('myService', service);
   * ```
   *
   * @internal Phase 309: BaseServices registered during bootstrap
   */
  public registerBaseService(key: string, service: BaseService): void {
    this.baseServices.set(key, service);
  }

  /**
   * Retrieve a registered BaseService instance
   *
   * @param {string} key - Service identifier
   * @returns {BaseService} The registered service instance
   *
   * @throws {Error} If service not registered, throws with descriptive message
   *
   * @example
   * ```typescript
   * const service = manager.getBaseService('myService');
   * await service.initialize?.();
   * ```
   *
   * @internal Called by CoreService.getBaseService()
   */
  public getBaseService(key: string): BaseService {
    const service = this.baseServices.get(key);
    if (!service) {
      throw new Error(`BaseService not found: ${key}`);
    }
    return service;
  }

  /**
   * Safely retrieve a BaseService (returns null on failure)
   *
   * **Error Handling**: Does not throw - returns null if service not found.
   * Useful for optional service lookups in non-critical paths.
   *
   * @param {string} key - Service identifier
   * @returns {BaseService | null} Service instance or null if not found
   *
   * @example
   * ```typescript
   * const service = manager.tryGetBaseService('optionalService');
   * if (service) {
   *   await service.initialize?.();
   * }
   * ```
   */
  public tryGetBaseService(key: string): BaseService | null {
    return this.baseServices.get(key) ?? null;
  }

  /**
   * Initialize a single BaseService (async)
   *
   * **Initialization State**: Tracks initialization to prevent duplicate
   * initialization. If already initialized, the call becomes a no-op.
   *
   * **Error Handling**: Throws on initialization failure. Caller must handle.
   *
   * @param {string} key - Service identifier
   * @throws {Error} If service not found or initialization fails
   *
   * @example
   * ```typescript
   * await manager.initializeBaseService('myService');
   * ```
   *
   * @internal Phase 309: Called during application bootstrap
   */
  public async initializeBaseService(key: string): Promise<void> {
    const service = this.getBaseService(key);

    if (this.initializedServices.has(key)) {
      return;
    }

    if (service.initialize) {
      await service.initialize();
    }
    this.initializedServices.add(key);
  }

  /**
   * Initialize multiple BaseServices in sequence (async)
   *
   * **Sequence**: Initializes services one-by-one in order.
   * If specific keys provided, initializes only those; otherwise initializes all.
   *
   * **Error Handling**: Continues initializing remaining services and surfaces
   * failures as a single `AggregateError` once all attempts complete.
   *
   * @param {string[]} [keys] - Optional list of service keys to initialize.
   *   If omitted, initializes all registered BaseServices.
   *
   * @example
   * ```typescript
   * // Initialize all registered BaseServices
   * await manager.initializeAllBaseServices();
   *
   * // Initialize specific services only
   * await manager.initializeAllBaseServices(['serviceA', 'serviceB']);
   * ```
   *
   * @internal Phase 309: Called during full application bootstrap
   */
  public async initializeAllBaseServices(keys?: string[]): Promise<void> {
    const serviceKeys = keys || Array.from(this.baseServices.keys());

    const failures: Array<{ key: string; error: Error }> = [];

    for (const key of serviceKeys) {
      try {
        await this.initializeBaseService(key);
      } catch (error) {
        const normalized = error instanceof Error ? error : new Error(String(error));
        failures.push({ key, error: normalized });
      }
    }

    if (failures.length > 0) {
      throw new AggregateError(
        failures.map(entry => entry.error),
        `BaseService initialization failed for: ${failures.map(entry => entry.key).join(', ')}`
      );
    }
  }

  /**
   * Check if BaseService is initialized
   *
   * **State Query**: Returns true only if initialize() has completed successfully.
   *
   * @param {string} key - Service identifier
   * @returns {boolean} True if initialized, false otherwise
   *
   * @example
   * ```typescript
   * if (manager.isBaseServiceInitialized('myService')) {
   *   // Service is ready to use
   * }
   * ```
   */
  public isBaseServiceInitialized(key: string): boolean {
    return this.initializedServices.has(key);
  }

  /**
   * Get list of all registered BaseService keys
   *
   * **Diagnostics**: Useful for debugging and health checks
   *
   * @returns {string[]} Array of registered BaseService identifiers
   *
   * @example
   * ```typescript
   * console.log(manager.getRegisteredBaseServices()); // ['svc1', 'svc2']
   * ```
   */
  public getRegisteredBaseServices(): string[] {
    return Array.from(this.baseServices.keys());
  }

  /**
   * Clean up all BaseServices (calling destroy hooks)
   *
   * **Lifecycle**: Calls destroy() on each initialized BaseService.
   * Used during application shutdown or test teardown.
   *
   * **Error Handling**: Collects cleanup failures and throws a single
   * `AggregateError` after attempting all destroy hooks.
   *
   * @internal Phase 137: Cleanup sequence for application shutdown
   */
  public cleanup(): void {
    const failures: Array<{ key: string; error: Error }> = [];

    for (const [key, service] of this.baseServices) {
      if (this.initializedServices.has(key)) {
        try {
          if (service.destroy) {
            service.destroy();
          }
        } catch (error) {
          const normalized = error instanceof Error ? error : new Error(String(error));
          failures.push({ key, error: normalized });
        }
      }
    }

    if (failures.length > 0) {
      throw new AggregateError(
        failures.map(entry => entry.error),
        `BaseService cleanup failed for: ${failures.map(entry => entry.key).join(', ')}`
      );
    }
  }

  /**
   * Reset all BaseServices (testing only)
   *
   * **Warning**: Clears all state without cleanup. Use in test teardown only.
   * For production shutdown, use cleanup() instead.
   *
   * @internal Phase 137: Test isolation - called by CoreService.reset()
   */
  public reset(): void {
    this.baseServices.clear();
    this.initializedServices.clear();
  }
}
