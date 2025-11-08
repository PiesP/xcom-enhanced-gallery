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

import { logger } from '../../logging';
import type { BaseService } from '../../types/core/base-service.types';

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

  constructor() {
    logger.debug('[ServiceLifecycleManager] Initialized');
  }

  /**
   * Register a BaseService instance for lifecycle management
   *
   * **Overwrite Handling**: If service with same key exists, logs warning
   * and replaces with new instance. Tracking continues with new instance.
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
    if (this.baseServices.has(key)) {
      logger.warn(`[ServiceLifecycleManager] BaseService overwrite: ${key}`);
    }
    this.baseServices.set(key, service);
    logger.debug(`[ServiceLifecycleManager] BaseService registered: ${key}`);
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
   * initialization. If already initialized, returns early with debug log.
   *
   * **Error Handling**: Throws on initialization failure. Caller must handle.
   *
   * @param {string} key - Service identifier
   * @throws {Error} If service not found or initialization fails
   *
   * @example
   * ```typescript
   * try {
   *   await manager.initializeBaseService('myService');
   * } catch (error) {
   *   logger.error('Initialization failed:', error);
   * }
   * ```
   *
   * @internal Phase 309: Called during application bootstrap
   */
  public async initializeBaseService(key: string): Promise<void> {
    const service = this.getBaseService(key);

    if (this.initializedServices.has(key)) {
      logger.debug(`[ServiceLifecycleManager] Already initialized: ${key}`);
      return;
    }

    try {
      logger.debug(`[ServiceLifecycleManager] Initializing BaseService: ${key}`);
      if (service.initialize) {
        await service.initialize();
      }
      this.initializedServices.add(key);
      logger.debug(`[ServiceLifecycleManager] Initialization completed: ${key}`);
    } catch (error) {
      logger.error(`[ServiceLifecycleManager] Initialization failed (${key}):`, error);
      throw error;
    }
  }

  /**
   * Initialize multiple BaseServices in sequence (async)
   *
   * **Sequence**: Initializes services one-by-one in order.
   * If specific keys provided, initializes only those; otherwise initializes all.
   *
   * **Error Handling**: Logs errors but continues initialization of other services.
   * Ensures all initialization attempts despite failures.
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
    logger.debug(`[ServiceLifecycleManager] Initializing ${serviceKeys.length} BaseServices...`);

    for (const key of serviceKeys) {
      try {
        await this.initializeBaseService(key);
      } catch (error) {
        logger.error(
          `[ServiceLifecycleManager] Initialization failed (${key}), continuing:`,
          error
        );
      }
    }

    logger.debug(`[ServiceLifecycleManager] All BaseServices initialization completed`);
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
   * **Error Handling**: Errors during cleanup are logged but don't stop
   * cleanup of other services. Ensures all cleanup happens despite failures.
   *
   * @internal Phase 137: Cleanup sequence for application shutdown
   */
  public cleanup(): void {
    logger.debug('[ServiceLifecycleManager] Cleanup started');

    for (const [key, service] of this.baseServices) {
      if (this.initializedServices.has(key)) {
        try {
          if (service.destroy) {
            service.destroy();
            logger.debug(`[ServiceLifecycleManager] BaseService destroy completed: ${key}`);
          }
        } catch (error) {
          logger.warn(`[ServiceLifecycleManager] BaseService destroy failed (${key}):`, error);
        }
      }
    }

    logger.debug('[ServiceLifecycleManager] Cleanup completed');
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
    logger.debug('[ServiceLifecycleManager] All BaseServices reset');
  }
}
