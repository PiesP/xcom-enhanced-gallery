/**
 * @fileoverview Service Registry (Storage Layer)
 * @description Specialized manager for direct service instance storage,
 * retrieval, and cleanup. Implements simple CRUD operations with
 * optional cleanup hooks support.
 *
 * **Responsibility**: Direct instance storage and retrieval only
 * (Single Responsibility Principle)
 *
 * **Pattern**: Registry is the "store" layer - where concrete instances
 * are held. Coordinates cleanup via destroy() and cleanup() methods
 * if instances provide them.
 *
 * **Phase Reference**: Phase 309 Service Layer Pattern, Phase 380 Optimization
 *
 * @version 1.0.0 - Service Manager Delegation Pattern (Registry Specialization)
 */

type CleanupCapable = { destroy?: () => void; cleanup?: () => void };

/**
 * Specialized registry manager for service instance storage
 *
 * **Responsibilities**:
 * - Store direct service instances by key
 * - Retrieve stored instances
 * - Cleanup instances with destroy/cleanup hooks
 * - Query service availability
 * - Reset for testing purposes
 *
 * **Separation of Concerns**: Delegates factory management to
 * {@link ServiceFactoryManager}. This class manages only direct
 * instances that were explicitly registered.
 *
 * @public
 */
export class ServiceRegistry {
  private readonly services = new Map<string, unknown>();

  constructor() {}

  /**
   * Register a service instance directly
   *
   * **Overwrite Handling**: If service with same key already exists,
   * logs warning and attempts to clean up the old instance before
   * replacing it. This prevents memory leaks from dangling listeners/timers.
   *
   * @param {string} key - Unique service identifier
   * @param {T} instance - Service instance to store
   *
   * @example
   * ```typescript
   * const registry = new ServiceRegistry();
   * registry.register('myService', new MyService());
   * ```
   *
   * @internal Phase 309: Instances registered during service initialization
   */
  public register<T>(key: string, instance: T): void {
    if (this.services.has(key)) {
      const prev = this.services.get(key);
      if (prev && typeof prev === 'object') {
        const candidate = prev as CleanupCapable;
        if (typeof candidate.destroy === 'function') {
          try {
            candidate.destroy();
          } catch {
            // Ignore cleanup failures on overwrite to avoid cascading issues.
          }
        }
        if (typeof candidate.cleanup === 'function') {
          try {
            candidate.cleanup();
          } catch {
            // Ignore cleanup failures on overwrite.
          }
        }
      }
    }

    this.services.set(key, instance);
  }

  /**
   * Retrieve a service instance by key
   *
   * @param {string} key - Service identifier
   * @returns {T} The stored service instance
   *
   * @throws {Error} If service not found, throws with descriptive message
   *
   * @example
   * ```typescript
   * const service = registry.get<MyService>('myService');
   * service.doSomething();
   * ```
   *
   * @internal Called by CoreService.get() after registry lookup
   */
  public get<T>(key: string): T {
    if (this.services.has(key)) {
      return this.services.get(key) as T;
    }
    throw new Error(`Service not found: ${key}`);
  }

  /**
   * Safely retrieve a service instance (returns null on failure)
   *
   * **Error Handling**: Does not throw - returns null if service not found.
   * Useful for optional service lookups in non-critical paths.
   *
   * @param {string} key - Service identifier
   * @returns {T | null} Service instance or null if not found
   *
   * @example
   * ```typescript
   * const service = registry.tryGet<MyService>('optionalService');
   * if (service) {
   *   service.doSomething();
   * }
   * ```
   */
  public tryGet<T>(key: string): T | null {
    if (!this.services.has(key)) {
      return null;
    }
    return this.services.get(key) as T;
  }

  /**
   * Check if service is registered
   *
   * @param {string} key - Service identifier
   * @returns {boolean} True if service exists, false otherwise
   *
   * @internal Used by CoreService.has() for availability checking
   */
  public has(key: string): boolean {
    return this.services.has(key);
  }

  /**
   * Get list of all registered service keys
   *
   * **Diagnostics**: Useful for debugging and health checks
   *
   * @returns {string[]} Array of registered service identifiers
   *
   * @example
   * ```typescript
   * console.log(registry.getRegisteredServices()); // ['svc1', 'svc2', 'svc3']
   * ```
   */
  public getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Clean up all registered services
   *
   * **Lifecycle**: Calls destroy() then cleanup() hooks on each service
   * if they exist. Used during application shutdown or test teardown.
   *
   * **Error Handling**: Errors during cleanup are logged but don't stop
   * cleanup of other services. Ensures all cleanup happens despite failures.
   *
   * @internal Phase 137: Cleanup sequence for application shutdown
   */
  public cleanup(): void {
    for (const instance of this.services.values()) {
      if (instance && typeof instance === 'object') {
        const inst = instance as CleanupCapable;
        // Call destroy() first (highest priority)
        if (typeof inst.destroy === 'function') {
          try {
            inst.destroy();
          } catch {
            // Continue cleanup to avoid leaking other services.
          }
        }

        // Call cleanup() as additional cleanup step
        if (typeof inst.cleanup === 'function') {
          try {
            inst.cleanup();
          } catch {
            // Continue cleanup even if one service fails.
          }
        }
      }
    }
  }

  /**
   * Reset all services (testing only)
   *
   * **Warning**: Clears all state without cleanup. Use in test teardown only.
   * For production shutdown, use cleanup() instead.
   *
   * @internal Phase 137: Test isolation - called by CoreService.reset()
   */
  public reset(): void {
    this.services.clear();
  }
}
