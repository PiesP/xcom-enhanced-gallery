/**
 * Service Factories - Type-safe Singleton Pattern
 * @version 4.0.0 - Phase 390: Type-safe factory pattern with generics
 *
 * External modules do not call new directly; instead, obtain service singletons through factory.
 * Test enforcement: direct instantiation is prohibited.
 *
 * **Phase History**:
 * - Phase 370: Circular dependency resolution (dynamic import)
 * - Phase 390: Type-safe factory pattern with generics
 *
 * **Type Safety**:
 * - Generic return types with BaseService constraint
 * - Lazy loading with Promise<T>
 * - Type inference from dynamic imports
 */

import type { BaseService } from '@shared/types/core/base-service.types';

// ====================================
// Type-safe Factory Pattern
// ====================================

/**
 * Generic lazy singleton holder
 * @template T Service type extending BaseService
 */
type LazyServiceInstance<T extends BaseService = BaseService> = Promise<T> | null;

// ====================================
// Media Service Factory
// ====================================

let mediaServiceInstance: LazyServiceInstance = null;

/**
 * MediaService factory with type inference
 * @returns Promise<MediaService> with full type safety
 *
 * @example
 * ```typescript
 * const mediaService = await getMediaService();
 * // mediaService is inferred as MediaService type
 * await mediaService.extractMedia(...);
 * ```
 */
export async function getMediaService(): Promise<BaseService> {
  if (!mediaServiceInstance) {
    // Use class-level singleton to avoid duplicate instances created via both
    // module-level exports (mediaService) and factory usage. This keeps shared
    // caches and prefetch state in sync across callers.
    mediaServiceInstance = import('./media-service').then(async m => {
      const service = m.MediaService.getInstance();
      // Ensure initialization to load MediaExtractionService dynamically
      await service.initialize();
      return service;
    });
  }
  return mediaServiceInstance;
}

// SettingsService factory lives in the feature layer (shared cannot import features directly)
// By contract (test), getSettingsService function export must exist, so error is thrown on call.
// Use initializeSettingsService() from @features/settings instead of this stub.
export async function getSettingsService(): Promise<never> {
  throw new Error('getSettingsService(): Use initializeSettingsService() from @features/settings');
}

/**
 * Factory reset (test only)
 */
export function __resetServiceFactories(): void {
  mediaServiceInstance = null;
}
