/**
 * @fileoverview Type-safe settings access utilities
 * @description Provides compile-time type checking for settings access
 * using TypeScript's template literal types and mapped types.
 *
 * @example
 * ```typescript
 * // Type-safe access with auto-complete and type inference
 * const preload = getTypedSettingOr('gallery.preloadCount', 3); // number
 * const theme = getTypedSettingOr('gallery.theme', 'auto'); // 'auto' | 'light' | 'dark'
 *
 * // Type error: 'gallery.invalid' is not a valid key
 * const invalid = getTypedSettingOr('gallery.invalid', 0);
 *
 * // Type error: value must be number
 * await setTypedSetting('gallery.preloadCount', 'not a number');
 * ```
 *
 * @module shared/container/typed-settings
 * @version 1.0.0
 */

import type { AppSettings } from '@features/settings/types/settings.types';
import { tryGetSettingsManager } from './service-accessors';

// =============================================================================
// Type Utilities for Dot-Notation Path Access
// =============================================================================

/**
 * Generate all valid dot-notation paths for a nested object type.
 * Recursively traverses the type structure to create union of all valid paths.
 *
 * @example
 * type Paths = SettingPaths<{ a: { b: number; c: string } }>;
 * // Result: 'a' | 'a.b' | 'a.c'
 */
type SettingPaths<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? // Include both the parent key and nested paths
          `${Prefix}${K}` | SettingPaths<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

/**
 * Extract the value type at a given dot-notation path.
 * Resolves nested paths to their corresponding value types.
 *
 * @example
 * type Value = SettingValueAt<AppSettings, 'gallery.preloadCount'>; // number
 */
type SettingValueAt<T, Path extends string> = Path extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? SettingValueAt<T[K], Rest>
    : never
  : Path extends keyof T
    ? T[Path]
    : never;

// =============================================================================
// Exported Types
// =============================================================================

/**
 * All valid setting paths in dot notation.
 * Provides autocomplete support and compile-time validation.
 *
 * @example
 * ```typescript
 * const validPath: SettingPath = 'gallery.preloadCount'; // ✅
 * const invalid: SettingPath = 'invalid.path'; // ❌ Type error
 * ```
 */
export type SettingPath = SettingPaths<AppSettings>;

/**
 * Get the value type for a specific setting path.
 * Enables type-safe access to deeply nested settings.
 *
 * @example
 * ```typescript
 * type PreloadType = SettingValue<'gallery.preloadCount'>; // number
 * type ThemeType = SettingValue<'gallery.theme'>; // 'auto' | 'light' | 'dark'
 * ```
 */
export type SettingValue<P extends SettingPath> = SettingValueAt<AppSettings, P>;

// =============================================================================
// Settings Service Interface
// =============================================================================

/**
 * Minimal interface for settings service integration.
 * Used to decouple typed settings utilities from concrete implementations.
 */
interface SettingsServiceLike {
  get<T = unknown>(key: string): T | undefined;
  set<T = unknown>(key: string, value: T): Promise<void>;
}

/**
 * Retrieves the registered SettingsService instance.
 * Throws an error if the service is not registered.
 *
 * @throws {Error} If SettingsService is not registered during bootstrap
 * @returns The registered SettingsService instance
 */
function requireSettingsService(): SettingsServiceLike {
  const service = tryGetSettingsManager<SettingsServiceLike>();
  if (!service) {
    throw new Error(
      __DEV__
        ? 'SettingsService is not registered. Ensure bootstrap registers it before usage.'
        : 'SettingsService not registered.'
    );
  }
  return service;
}

// =============================================================================
// Type-Safe Setting Access Functions
// =============================================================================

/**
 * Get a setting value with a fallback default.
 * Returns the fallback if the setting is undefined.
 *
 * @param path - Dot-notation path to the setting
 * @param fallback - Default value if setting is undefined
 * @returns The setting value or fallback
 *
 * @example
 * ```typescript
 * const count = getTypedSettingOr('gallery.preloadCount', 3); // number
 * const theme = getTypedSettingOr('gallery.theme', 'auto'); // 'auto' | 'light' | 'dark'
 * ```
 */
export function getTypedSettingOr<P extends SettingPath>(
  path: P,
  fallback: SettingValue<P>
): SettingValue<P> {
  const value = requireSettingsService().get<SettingValue<P>>(path);
  return value === undefined ? fallback : value;
}

/**
 * Set a setting value with full type safety.
 * Value type must match the expected type for the given path.
 *
 * @param path - Dot-notation path to the setting
 * @param value - New value (must match expected type)
 * @returns Promise that resolves when setting is persisted
 *
 * @example
 * ```typescript
 * // Type-safe: value must be number
 * await setTypedSetting('gallery.preloadCount', 5);
 *
 * // Type error: value must be 'auto' | 'light' | 'dark'
 * await setTypedSetting('gallery.theme', 'invalid');
 * ```
 */
export function setTypedSetting<P extends SettingPath>(
  path: P,
  value: SettingValue<P>
): Promise<void> {
  return requireSettingsService().set(path, value);
}
