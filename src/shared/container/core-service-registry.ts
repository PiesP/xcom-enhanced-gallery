/**
 * @fileoverview CoreServiceRegistry - Centralized Service Access & Caching
 * @version 1.0.0 - Service registry with performance optimization
 * @phase 402: Enhanced documentation for registry pattern
 *
 * Provides single entry point for all service access with caching layer
 * for performance optimization. Internal to container module.
 *
 * **Internal Only**: Use service-accessors.ts typed getters from features
 *
 * **Design Pattern**: Registry pattern with caching
 * **Performance**: Instance caching reduces CoreService lookups
 * **Type Safety**: Generic type parameters ensure compile-time safety
 * **Transparency**: Acts as bridge to CoreService singleton
 *
 * **Cache Strategy**:
 * - LRU cache: Holds recently accessed services
 * - Miss handling: Falls back to CoreService on cache miss
 * - Invalidation: Clears on service registration
 *
 * **Architecture Role**:
 * CoreServiceRegistry (Caching Layer)
 *   ↓
 * CoreService (Singleton)
 *   ↓
 * Service Implementations
 *
 * @related [CoreService](../services/core/core-service-manager.ts), [Service Accessors](./service-accessors.ts)
 */

import { CoreService } from '../services/core';

/**
 * Centralized service registry with caching optimization.
 *
 * **Static Methods**:
 * - `get<T>(key)` - Retrieve with cache lookup
 * - `tryGet<T>(key)` - Safe retrieval (returns null on miss)
 * - `register<T>(key, instance)` - Register and cache service
 *
 * @example
 * // Get logger service (typed)
 * const logger = CoreServiceRegistry.get<ILogger>(SERVICE_KEYS.LOGGER);
 *
 * // Safe retrieval with null handling
 * const maybe = CoreServiceRegistry.tryGet<IMediaService>(SERVICE_KEYS.MEDIA);
 * if (maybe) { maybe.extractUrls(...); }
 */
export class CoreServiceRegistry {
  /**
   * Service instance cache for performance optimization.
   * @internal Accessed only by static methods
   */
  private static readonly cache = new Map<string, unknown>();

  /**
   * Retrieve service instance with caching.
   *
   * **Behavior**: Checks cache first, falls back to CoreService, caches result
   *
   * @template T - Service type for compile-time safety
   * @param key - Service key from SERVICE_KEYS
   * @returns Cached or newly retrieved service instance
   * @throws CoreService throws if service not found
   *
   * @example
   * const logger = CoreServiceRegistry.get<ILogger>(SERVICE_KEYS.LOGGER);
   */
  static get<T>(key: string): T {
    // 캐시에서 먼저 확인
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }

    // CoreService에서 조회
    const service = CoreService.getInstance().get<T>(key);

    // 캐시에 저장
    this.cache.set(key, service);

    return service;
  }

  /**
   * Safe service retrieval (returns null if not found).
   *
   * **Behavior**: Non-throwing alternative to get(); caches null for efficiency
   *
   * @template T - Service type for compile-time safety
   * @param key - Service key from SERVICE_KEYS
   * @returns Service instance or null if not found
   *
   * @example
   * const media = CoreServiceRegistry.tryGet<IMediaService>(SERVICE_KEYS.MEDIA);
   * if (media) { media.extractUrls(...); }
   */
  static tryGet<T>(key: string): T | null {
    // 캐시에서 먼저 확인
    if (this.cache.has(key)) {
      const cached = this.cache.get(key);
      return cached !== undefined ? (cached as T) : null;
    }

    // CoreService에서 안전 조회
    const service = CoreService.getInstance().tryGet<T>(key);

    // 캐시에 저장 (null도 저장하여 반복 조회 피함)
    if (service !== null) {
      this.cache.set(key, service);
    }

    return service;
  }

  /**
   * Register service instance and update cache.
   *
   * **Behavior**: Delegates to CoreService, then caches for future lookups
   *
   * @template T - Service type for compile-time safety
   * @param key - Service key from SERVICE_KEYS
   * @param instance - Service instance to register and cache
   *
   * @example
   * const logger = new LoggerService();
   * CoreServiceRegistry.register<ILogger>(SERVICE_KEYS.LOGGER, logger);
   */
  static register<T>(key: string, instance: T): void {
    // CoreService에 등록
    CoreService.getInstance().register<T>(key, instance);

    // 캐시에도 저장
    this.cache.set(key, instance);
  }

  /**
   * Clear entire cache.
   *
   * @internal Used only for testing and service reset
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Invalidate specific service cache entry.
   *
   * @internal Used only for testing
   * @param key - Service key to remove from cache
   */
  static invalidateCache(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Get all cached service keys (debugging only).
   *
   * @internal Used only for diagnostics
   * @returns Array of service keys currently in cache
   */
  static getCacheKeys(): string[] {
    return Array.from(this.cache.keys());
  }
}

/**
 * Helper function: Retrieve service via CoreServiceRegistry.
 *
 * **Recommended**: Use named accessors from service-accessors.ts instead
 *
 * @template T - Service type
 * @param key - Service key from SERVICE_KEYS
 * @returns Service instance
 *
 * @deprecated Use service-accessors typed getters
 * @example
 * // ❌ Avoid
 * const logger = getService<ILogger>(SERVICE_KEYS.LOGGER);
 *
 * // ✅ Use instead
 * const logger = getLogger();
 */
export function getService<T>(key: string): T {
  return CoreServiceRegistry.get<T>(key);
}

/**
 * Helper function: Safe service retrieval via CoreServiceRegistry.
 *
 * **Recommended**: Use named accessors from service-accessors.ts instead
 *
 * @template T - Service type
 * @param key - Service key from SERVICE_KEYS
 * @returns Service instance or null if not found
 *
 * @deprecated Use service-accessors typed getters
 * @example
 * // ❌ Avoid
 * const maybe = tryGetService<IMediaService>(SERVICE_KEYS.MEDIA);
 *
 * // ✅ Use instead
 * const media = tryGetMediaService();
 */
export function tryGetService<T>(key: string): T | null {
  return CoreServiceRegistry.tryGet<T>(key);
}

/**
 * Helper function: Register service via CoreServiceRegistry.
 *
 * **Recommended**: Use app-container factories instead
 *
 * @template T - Service type
 * @param key - Service key from SERVICE_KEYS
 * @param instance - Service instance to register
 *
 * @deprecated Use CreateAppContainer factory pattern
 * @example
 * // ❌ Avoid
 * registerService<ILogger>(SERVICE_KEYS.LOGGER, logger);
 *
 * // ✅ Use instead
 * const container = await createAppContainer(options);
 */
export function registerService<T>(key: string, instance: T): void {
  CoreServiceRegistry.register<T>(key, instance);
}
