/**
 * @fileoverview Core Service Management Orchestrator
 * @description Simplified service manager implementing Orchestrator Pattern.
 * Coordinates three specialized managers (Registry, Factory, Lifecycle) to
 * provide unified service management API.
 *
 * **Responsibility**: Orchestration and delegation only (Single Responsibility)
 *
 * **Pattern**: Central orchestrator that delegates to specialized managers:
 * - {@link ServiceRegistry}: Direct instance storage
 * - {@link ServiceFactoryManager}: Factory registration and caching
 * - {@link ServiceLifecycleManager}: BaseService initialization and cleanup
 *
 * **Phase Reference**: Phase 309 Service Layer Pattern, Phase 380 Optimization, Phase 354 Naming
 *
 * @version 2.0.0 - Service Manager Delegation Pattern (Complete Separation)
 */

import type { BaseService } from '@shared/types/core/base-service.types';
import { ServiceRegistry } from './service-registry';
import { ServiceFactoryManager } from './service-factory';
import { ServiceLifecycleManager } from './service-lifecycle';

/**
 * Central service manager (Orchestrator Pattern)
 *
 * Coordinates three specialized managers:
 * - **ServiceRegistry**: Stores direct instances (CRUD operations)
 * - **ServiceFactoryManager**: Manages factory functions and caching
 * - **ServiceLifecycleManager**: Handles BaseService init/cleanup lifecycle
 *
 * **Design**:
 * Acts as facade providing unified API while delegating actual work
 * to specialized managers. Follows Single Responsibility Principle by
 * keeping each manager focused on one concern.
 *
 * @public
 */
export class CoreService {
  private static instance: CoreService | null = null;
  private readonly registry = new ServiceRegistry();
  private readonly factory = new ServiceFactoryManager();
  private readonly lifecycle = new ServiceLifecycleManager();

  private constructor() {}

  /**
   * Get singleton instance
   *
   * **Singleton**: CoreService is a singleton. Only one instance exists
   * per application lifecycle.
   *
   * @returns {CoreService} The singleton instance
   *
   * @example
   * ```typescript
   * const manager = CoreService.getInstance();
   * ```
   */
  public static getInstance(): CoreService {
    if (!CoreService.instance) {
      CoreService.instance = new CoreService();
    }
    return CoreService.instance;
  }

  // ====================================
  // Registry Delegation (Storage Layer)
  // ====================================

  /**
   * Register a service instance directly
   *
   * **Delegation**: Forwards to {@link ServiceRegistry}
   *
   * @param {string} key - Unique service identifier
   * @param {T} instance - Service instance to store
   *
   * @example
   * ```typescript
   * const manager = CoreService.getInstance();
   * manager.register('myService', new MyService());
   * ```
   *
   * @internal Phase 309: Called during service initialization
   */
  public register<T>(key: string, instance: T): void {
    this.registry.register<T>(key, instance);
  }

  /**
   * Retrieve a service instance
   *
   * **Lookup Order**:
   * 1. Check registry for direct instances first
   * 2. Fall back to factory if not found in registry
   * 3. Throw if neither location has service
   *
   * **Delegation**: Uses {@link ServiceRegistry} and {@link ServiceFactoryManager}
   *
   * @param {string} key - Service identifier
   * @returns {T} The requested service instance
   *
   * @throws {Error} If service not found in registry or factory
   *
   * @example
   * ```typescript
   * const service = manager.get<MyService>('myService');
   * ```
   */
  public get<T>(key: string): T {
    // Check registry first
    if (this.registry.has(key)) {
      return this.registry.get<T>(key);
    }

    // Fall back to factory
    const fromFactory = this.factory.createFromFactory<T>(key);
    if (fromFactory !== null) {
      return fromFactory;
    }

    throw new Error(`Service not found: ${key}`);
  }

  /**
   * Safely retrieve a service (returns null on failure)
   *
   * **Error Handling**: Does not throw - returns null if service not found
   *
   * @param {string} key - Service identifier
   * @returns {T | null} Service instance or null if not found
   *
   * @example
   * ```typescript
   * const service = manager.tryGet<MyService>('optionalService');
   * if (service) {
   *   service.doSomething();
   * }
   * ```
   */
  public tryGet<T>(key: string): T | null {
    const fromRegistry = this.registry.tryGet<T>(key);
    if (fromRegistry !== null) {
      return fromRegistry;
    }
    return this.factory.createFromFactory<T>(key);
  }

  /**
   * Check if service is registered or has factory
   *
   * @param {string} key - Service identifier
   * @returns {boolean} True if service exists in registry or factory
   *
   * @internal Phase 309: Used to query service availability
   */
  public has(key: string): boolean {
    return this.registry.has(key) || this.factory.hasFactory(key);
  }

  /**
   * Get list of registered service keys
   *
   * @returns {string[]} Array of service identifiers in registry
   *
   * @example
   * ```typescript
   * console.log(manager.getRegisteredServices()); // ['svc1', 'svc2']
   * ```
   */
  public getRegisteredServices(): string[] {
    return this.registry.getRegisteredServices();
  }

  // ====================================
  // Factory Delegation (Factory Layer)
  // ====================================

  /**
   * Register a service factory function
   *
   * **Delegation**: Forwards to {@link ServiceFactoryManager}
   *
   * @param {string} key - Unique factory identifier
   * @param {() => T} factory - Factory function (called on-demand)
   *
   * @example
   * ```typescript
   * const manager = CoreService.getInstance();
   * manager.registerFactory('myService', () => new MyService());
   * ```
   *
   * @internal Phase 309: Called during factory registration phase
   */
  public registerFactory<T>(key: string, factory: () => T): void {
    this.factory.registerFactory<T>(key, factory);
  }

  // ====================================
  // Lifecycle Delegation (BaseService Lifecycle)
  // ====================================

  /**
   * Register a BaseService for lifecycle management
   *
   * **Delegation**: Forwards to {@link ServiceLifecycleManager}
   *
   * @param {string} key - Unique service identifier
   * @param {BaseService} service - Service implementing BaseService interface
   *
   * @example
   * ```typescript
   * const manager = CoreService.getInstance();
   * const service = new MyService();
   * manager.registerBaseService('myService', service);
   * ```
   *
   * @internal Phase 309: Called during BaseService registration
   */
  public registerBaseService(key: string, service: BaseService): void {
    this.lifecycle.registerBaseService(key, service);
  }

  /**
   * Retrieve a BaseService instance
   *
   * **Delegation**: Forwards to {@link ServiceLifecycleManager}
   *
   * @param {string} key - Service identifier
   * @returns {BaseService} The registered service
   *
   * @throws {Error} If service not registered
   *
   * @example
   * ```typescript
   * const service = manager.getBaseService('myService');
   * ```
   *
   * @internal Called to access BaseService instances
   */
  public getBaseService(key: string): BaseService {
    return this.lifecycle.getBaseService(key);
  }

  /**
   * Safely retrieve a BaseService (returns null on failure)
   *
   * @param {string} key - Service identifier
   * @returns {BaseService | null} Service or null if not found
   *
   * @example
   * ```typescript
   * const service = manager.tryGetBaseService('optionalService');
   * ```
   */
  public tryGetBaseService(key: string): BaseService | null {
    return this.lifecycle.tryGetBaseService(key);
  }

  /**
   * Initialize a single BaseService (async)
   *
   * **Delegation**: Forwards to {@link ServiceLifecycleManager}
   *
   * @param {string} key - Service identifier
   * @throws {Error} If service not registered or initialization fails
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
   * @internal Phase 309: Called during bootstrap sequence
   */
  public async initializeBaseService(key: string): Promise<void> {
    return this.lifecycle.initializeBaseService(key);
  }

  /**
   * Initialize multiple BaseServices in sequence (async)
   *
   * **Delegation**: Forwards to {@link ServiceLifecycleManager}
   *
   * @param {string[]} [keys] - Optional service keys to initialize.
   *   If omitted, initializes all registered BaseServices.
   *
   * @example
   * ```typescript
   * // Initialize all
   * await manager.initializeAllBaseServices();
   *
   * // Initialize specific services
   * await manager.initializeAllBaseServices(['svc1', 'svc2']);
   * ```
   *
   * @internal Phase 309: Called during full bootstrap
   */
  public async initializeAllBaseServices(keys?: string[]): Promise<void> {
    return this.lifecycle.initializeAllBaseServices(keys);
  }

  /**
   * Check if BaseService is initialized
   *
   * @param {string} key - Service identifier
   * @returns {boolean} True if initialized, false otherwise
   *
   * @example
   * ```typescript
   * if (manager.isBaseServiceInitialized('myService')) {
   *   // Ready to use
   * }
   * ```
   */
  public isBaseServiceInitialized(key: string): boolean {
    return this.lifecycle.isBaseServiceInitialized(key);
  }

  /**
   * Get list of registered BaseService keys
   *
   * @returns {string[]} Array of BaseService identifiers
   *
   * @example
   * ```typescript
   * console.log(manager.getRegisteredBaseServices()); // ['svc1', 'svc2']
   * ```
   */
  public getRegisteredBaseServices(): string[] {
    return this.lifecycle.getRegisteredBaseServices();
  }

  // ====================================
  // Diagnostics (Monitoring)
  // ====================================

  /**
   * Get diagnostic information
   *
   * **Returns**: Service registration stats and detailed instance info
   *
   * @returns {object} Diagnostics object with:
   *   - registeredServices: Total services count
   *   - activeInstances: Initialized services count
   *   - services: Array of service keys
   *   - instances: Map of key→initialized status
   *
   * @example
   * ```typescript
   * const diag = manager.getDiagnostics();
   * console.log(`${diag.activeInstances}/${diag.registeredServices} services ready`);
   * ```
   *
   * @internal Phase 137: Used for health checks and debugging
   */
  public getDiagnostics(): {
    registeredServices: number;
    activeInstances: number;
    services: string[];
    instances: Record<string, boolean>;
  } {
    const services = this.getRegisteredServices();
    const instances: Record<string, boolean> = {};

    for (const key of services) {
      instances[key] = this.registry.has(key);
    }

    return {
      registeredServices: services.length,
      activeInstances: services.filter(key => instances[key]).length,
      services,
      instances,
    };
  }

  // ====================================
  // Cleanup & Reset
  // ====================================

  /**
   * Clean up and destroy all services
   *
   * **Lifecycle**: Called during application shutdown.
   * Calls destroy/cleanup on all services.
   *
   * @example
   * ```typescript
   * // On application shutdown
   * manager.cleanup();
   * ```
   *
   * @internal Phase 137: Cleanup sequence for graceful shutdown
   */
  public cleanup(): void {
    this.lifecycle.cleanup();
    this.registry.cleanup();
  }

  /**
   * Reset all services (testing only)
   *
   * **Warning**: Clears all state without calling cleanup.
   * Use only in test teardown, not for production shutdown.
   *
   * @internal Phase 137: Test isolation - clears singleton state
   */
  public reset(): void {
    this.registry.reset();
    this.factory.reset();
    this.lifecycle.reset();
  }

  /**
   * Reset singleton instance (testing only)
   *
   * **Warning**: Destroys the singleton. Only use in test teardown.
   * New calls to getInstance() will create a new instance.
   *
   * @internal Phase 137: Test isolation - clears singleton reference
   */
  public static resetInstance(): void {
    if (CoreService.instance) {
      CoreService.instance.reset();
      CoreService.instance = null;
    }
  }
}

/**
 * Global service manager singleton instance
 *
 * **Usage**: Access the central service manager
 * ```typescript
 * serviceManager.register('myService', instance);
 * const service = serviceManager.get('myService');
 * ```
 *
 * @public
 */
export const serviceManager = CoreService.getInstance();

/**
 * Type-safe service accessor helper function
 *
 * **Purpose**: Provides type-safe access to services.
 * Always retrieves from current singleton (useful in tests).
 *
 * **Difference from serviceManager**: This function always uses the current
 * singleton, which is important in test environments where the singleton
 * might be recreated.
 *
 * @template T - Service type
 * @param {string} key - Service identifier
 * @returns {T} The requested service instance
 *
 * @throws {Error} If service not found
 *
 * @example
 * ```typescript
 * const service = getService<MyService>('myService');
 * ```
 *
 * @public Phase 309: Helper for type-safe access
 */
export function getService<T>(key: string): T {
  return CoreService.getInstance().get<T>(key);
}

/**
 * Service factory registration helper function (testing)
 *
 * **Purpose**: Global function for factory registration in tests.
 * Phase 137 compatibility for test environments.
 *
 * @template T - Factory return type
 * @param {string} key - Factory identifier
 * @param {() => T} factory - Factory function
 *
 * @example
 * ```typescript
 * registerServiceFactory('myService', () => new MyService());
 * ```
 *
 * @internal Phase 6: Service factory registration, Phase 137: Test support
 */
export function registerServiceFactory<T>(key: string, factory: () => T): void {
  CoreService.getInstance().registerFactory<T>(key, factory);
}
