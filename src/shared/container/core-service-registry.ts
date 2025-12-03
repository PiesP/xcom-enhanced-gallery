/**
 * @fileoverview Core Service Registry - Legacy Facade (Backward Compatibility Only)
 * @description Phase 500: Removed redundant caching layer.
 *              Phase 600: Deprecated in favor of direct CoreService usage.
 *
 * **Status: DEPRECATED**
 *
 * This module is maintained only for backward compatibility with existing code.
 * New code should use CoreService directly.
 *
 * ## Migration Guide
 *
 * ### Before (deprecated):
 * ```typescript
 * import { CoreServiceRegistry } from '@shared/container/core-service-registry';
 * CoreServiceRegistry.register('key', instance);
 * const service = CoreServiceRegistry.get<MyService>('key');
 * ```
 *
 * ### After (recommended):
 * ```typescript
 * import { CoreService } from '@shared/services/service-manager';
 * CoreService.getInstance().register('key', instance);
 * const service = CoreService.getInstance().get<MyService>('key');
 * ```
 *
 * ### For typed accessors, use service-accessors.ts:
 * ```typescript
 * import { getThemeService, getMediaService } from '@shared/container/service-accessors';
 * const theme = getThemeService();
 * const media = getMediaService();
 * ```
 *
 * @deprecated Use CoreService from @shared/services/service-manager directly
 * @version 4.0.0 - Deprecated, backward compatibility only
 */

import { CoreService } from '@shared/services/service-manager';

/**
 * CoreServiceRegistry - Legacy Facade for CoreService
 *
 * @deprecated Use CoreService.getInstance() directly instead.
 *
 * Direct pass-through to CoreService. No caching layer needed
 * since CoreService's internal Map already provides O(1) access.
 */
export const CoreServiceRegistry = {
  /**
   * @deprecated Use CoreService.getInstance().register() instead
   */
  register<T>(key: string, instance: T): void {
    CoreService.getInstance().register<T>(key, instance);
  },

  /**
   * @deprecated Use CoreService.getInstance().get() instead
   */
  get<T>(key: string): T {
    return CoreService.getInstance().get<T>(key);
  },

  /**
   * @deprecated Use CoreService.getInstance().tryGet() instead
   */
  tryGet<T>(key: string): T | null {
    return CoreService.getInstance().tryGet<T>(key);
  },

  /**
   * @deprecated Use CoreService.getInstance().has() instead
   */
  has(key: string): boolean {
    return CoreService.getInstance().has(key);
  },

  /**
   * @deprecated Use CoreService.getInstance().getRegisteredServices() instead
   */
  getRegisteredServices(): string[] {
    return CoreService.getInstance().getRegisteredServices();
  },
};

/**
 * Helper function to register a service
 * @deprecated Use CoreService.getInstance().register() instead
 */
export function registerService<T>(key: string, instance: T): void {
  CoreServiceRegistry.register<T>(key, instance);
}

/**
 * Helper function to get a service (throws if not found)
 * @deprecated Use CoreService.getInstance().get() instead
 */
export function getService<T>(key: string): T {
  return CoreServiceRegistry.get<T>(key);
}

/**
 * Helper function to try getting a service (returns null if not found)
 * @deprecated Use CoreService.getInstance().tryGet() instead
 */
export function tryGetService<T>(key: string): T | null {
  return CoreServiceRegistry.tryGet<T>(key);
}
