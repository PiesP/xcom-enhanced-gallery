/**
 * Test harness utilities for service registration and management.
 *
 * Provides a simplified interface for test environments and local development
 * tooling to manage service instances through CoreService registry.
 *
 * @module harness
 * @example
 * ```typescript
 * const harness = createTestHarness();
 * harness.register('ui.theme', mockThemeService);
 * const theme = harness.get<ThemeService>('ui.theme');
 * harness.reset();
 * ```
 */

import { CoreService } from '@shared/services/service-manager';

/**
 * Test harness interface for service management.
 *
 * Provides methods to register, retrieve, and reset service instances
 * in test environments.
 */
export interface TestHarness {
  /**
   * Register a service instance with the given key.
   *
   * @template T - Service instance type
   * @param key - Service identifier key
   * @param instance - Service instance to register
   */
  readonly register: <T>(key: string, instance: T) => void;

  /**
   * Retrieve a service instance by key.
   *
   * @template T - Expected service type
   * @param key - Service identifier key
   * @returns Service instance
   * @throws {Error} If service not found
   */
  readonly get: <T>(key: string) => T;

  /**
   * Try to retrieve a service instance by key.
   *
   * @template T - Expected service type
   * @param key - Service identifier key
   * @returns Service instance or null if not found
   */
  readonly tryGet: <T>(key: string) => T | null;

  /**
   * Reset all registered services.
   *
   * Clears the service registry. Use this between tests to ensure isolation.
   */
  readonly reset: () => void;
}

/**
 * Create a test harness for service management.
 *
 * Returns a simplified interface to CoreService registry operations,
 * suitable for test environments and development tooling.
 *
 * @returns TestHarness instance
 * @example
 * ```typescript
 * const harness = createTestHarness();
 *
 * // Register mock services
 * harness.register(SERVICE_KEYS.THEME, mockThemeService);
 * harness.register(SERVICE_KEYS.LANGUAGE, mockLanguageService);
 *
 * // Retrieve services in tests
 * const theme = harness.get<ThemeService>(SERVICE_KEYS.THEME);
 *
 * // Clean up after tests
 * afterEach(() => {
 *   harness.reset();
 * });
 * ```
 */
export function createTestHarness(): TestHarness {
  const registry = CoreService.getInstance();

  return {
    register: <T>(key: string, instance: T): void => {
      registry.register<T>(key, instance);
    },
    get: <T>(key: string): T => registry.get<T>(key),
    tryGet: <T>(key: string): T | null => registry.tryGet<T>(key),
    reset: (): void => {
      registry.reset();
    },
  };
}
