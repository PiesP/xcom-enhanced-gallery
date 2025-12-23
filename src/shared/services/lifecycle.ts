/**
 * @fileoverview Service Lifecycle Composition Utilities
 * @version 1.0.0 - Phase: Service Initialization Abstraction
 *
 * Provides composition-based service lifecycle management as an alternative
 * to the inheritance-based BaseServiceImpl pattern.
 *
 * **Design Goals**:
 * - Composition over Inheritance
 * - Type-safe lifecycle hooks
 * - Backward compatible with BaseService interface
 * - Testable and mockable
 *
 * **Usage**:
 * ```typescript
 * // Simple service with lifecycle
 * const myService = createLifecycle('MyService', {
 *   onInitialize: async () => { ... },
 *   onDestroy: () => { ... },
 * });
 *
 * await myService.initialize();
 * myService.destroy();
 * ```
 */

import { logger } from '@shared/logging';

// ============================================================================
// Types
// ============================================================================

/**
 * Lifecycle hooks configuration
 */
interface LifecycleHooks {
  /**
   * Called during initialization (async supported)
   * @throws Error if initialization fails
   */
  readonly onInitialize?: () => Promise<void> | void;

  /**
   * Called during destruction (sync only)
   * Errors are logged but don't prevent cleanup
   */
  readonly onDestroy?: () => void;
}

/**
 * Lifecycle state and methods
 */
export interface Lifecycle {
  /**
   * Initialize the service (idempotent)
   * @throws Error if initialization fails
   */
  readonly initialize: () => Promise<void>;

  /**
   * Destroy the service (idempotent, graceful on error)
   */
  readonly destroy: () => void;

  /**
   * Check if service is initialized
   */
  readonly isInitialized: () => boolean;

  /**
   * Service name for logging
   */
  readonly serviceName: string;
}

/**
 * Options for createLifecycle
 */
interface CreateLifecycleOptions extends LifecycleHooks {
  /**
   * Skip logging (useful for internal/utility services)
   * @default false
   */
  readonly silent?: boolean;
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a lifecycle manager for a service.
 *
 * This provides composition-based lifecycle management as an alternative
 * to extending BaseServiceImpl.
 *
 * **Features**:
 * - Idempotent initialize/destroy
 * - Fail-fast on initialization error
 * - Graceful error handling on destroy
 * - Logging integration
 *
 * @param serviceName - Name for logging
 * @param options - Lifecycle hooks and options
 * @returns Lifecycle interface
 *
 * @example
 * ```typescript
 * const cache = createLifecycle('CacheService', {
 *   onInitialize: async () => {
 *     await loadCacheFromStorage();
 *   },
 *   onDestroy: () => {
 *     clearCache();
 *   },
 * });
 *
 * await cache.initialize();
 * // ... use cache ...
 * cache.destroy();
 * ```
 */
export function createLifecycle(
  serviceName: string,
  options: CreateLifecycleOptions = {}
): Lifecycle {
  const { onInitialize, onDestroy, silent = false } = options;

  let initialized = false;

  // Keep production bundles lean:
  // - `__DEV__` is compile-time replaced by Vite.
  // - When `__DEV__` is false, this becomes a constant false and Rollup can
  //   drop all logging strings and branches.
  const shouldLog =
    __DEV__ && !silent && typeof logger?.info === 'function' && typeof logger?.error === 'function';

  const initialize = async (): Promise<void> => {
    if (initialized) return;

    if (shouldLog) {
      logger.info(`${serviceName} initializing...`);
    }

    try {
      if (onInitialize) {
        await onInitialize();
      }
      initialized = true;

      if (shouldLog) {
        logger.info(`${serviceName} initialized`);
      }
    } catch (error) {
      if (shouldLog) {
        logger.error(`${serviceName} initialization failed:`, error);
      }
      throw error;
    }
  };

  const destroy = (): void => {
    if (!initialized) return;

    if (shouldLog) {
      logger.info(`${serviceName} destroying...`);
    }

    try {
      if (onDestroy) {
        onDestroy();
      }

      if (shouldLog) {
        logger.info(`${serviceName} destroyed`);
      }
    } catch (error) {
      if (shouldLog) {
        logger.error(`${serviceName} destroy failed:`, error);
      }
    } finally {
      initialized = false;
    }
  };

  const isInitialized = (): boolean => initialized;

  return {
    initialize,
    destroy,
    isInitialized,
    serviceName,
  };
}
