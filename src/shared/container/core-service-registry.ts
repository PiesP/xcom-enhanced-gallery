/**
 * @fileoverview Core Service Registry - Simplified Facade
 * @description Phase 500: Removed redundant caching layer.
 *              Now a thin facade over CoreService for backward compatibility.
 *
 * **Why keep this file?**
 * - Maintains backward compatibility with existing imports
 * - Provides convenient helper functions (registerService, getService)
 * - Central location for service access patterns
 *
 * @version 4.0.0 - Removed redundant caching
 */

import { CoreService } from '@shared/services/service-manager';

/**
 * CoreServiceRegistry - Facade for CoreService
 *
 * Direct pass-through to CoreService. No caching layer needed
 * since CoreService's internal Map already provides O(1) access.
 */
export const CoreServiceRegistry = {
  register<T>(key: string, instance: T): void {
    CoreService.getInstance().register<T>(key, instance);
  },

  get<T>(key: string): T {
    return CoreService.getInstance().get<T>(key);
  },

  tryGet<T>(key: string): T | null {
    return CoreService.getInstance().tryGet<T>(key);
  },

  has(key: string): boolean {
    return CoreService.getInstance().has(key);
  },

  getRegisteredServices(): string[] {
    return CoreService.getInstance().getRegisteredServices();
  },
};

/**
 * Helper function to register a service
 */
export function registerService<T>(key: string, instance: T): void {
  CoreServiceRegistry.register<T>(key, instance);
}

/**
 * Helper function to get a service (throws if not found)
 */
export function getService<T>(key: string): T {
  return CoreServiceRegistry.get<T>(key);
}

/**
 * Helper function to try getting a service (returns null if not found)
 */
export function tryGetService<T>(key: string): T | null {
  return CoreServiceRegistry.tryGet<T>(key);
}
