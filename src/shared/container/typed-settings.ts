/**
 * @fileoverview Type-safe settings access utilities
 * @description Provides compile-time type checking for settings access
 * using TypeScript's template literal types and mapped types.
 *
 * @example
 * ```typescript
 * // Type-safe access with auto-complete and type inference
 * const preload = getTypedSetting('gallery.preloadCount'); // number
 * const theme = getTypedSetting('gallery.theme'); // 'auto' | 'light' | 'dark'
 *
 * // Type error: 'gallery.invalid' is not a valid key
 * const invalid = getTypedSetting('gallery.invalid');
 *
 * // Type error: value must be number
 * await setTypedSetting('gallery.preloadCount', 'not a number');
 * ```
 *
 * @module shared/container/typed-settings
 * @version 1.0.0
 */

import { DEFAULT_SETTINGS } from '@constants/default-settings';
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
 */
export type SettingPath = SettingPaths<AppSettings>;

/**
 * Get the value type for a specific setting path.
 * Enables type-safe access to deeply nested settings.
 */
export type SettingValue<P extends SettingPath> = SettingValueAt<AppSettings, P>;

// =============================================================================
// Settings Service Interface
// =============================================================================

interface SettingsServiceLike {
  get<T = unknown>(key: string): T | undefined;
  set<T = unknown>(key: string, value: T): Promise<void>;
}

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
 * Get a setting value with full type safety.
 * Path must be a valid setting key, and return type is automatically inferred.
 *
 * @param path - Dot-notation path to the setting (autocomplete supported)
 * @returns The setting value or undefined if not set
 *
 * @example
 * ```typescript
 * // Return type is automatically inferred
 * const count = getTypedSetting('gallery.preloadCount'); // number | undefined
 * const theme = getTypedSetting('gallery.theme'); // 'auto' | 'light' | 'dark' | undefined
 * ```
 */
export function getTypedSetting<P extends SettingPath>(path: P): SettingValue<P> | undefined {
  return requireSettingsService().get<SettingValue<P>>(path);
}

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

// =============================================================================
// Optional: Try-variants for nullable service access
// =============================================================================

/**
 * Try to get a setting value without throwing if service is unavailable.
 * Returns undefined if service is not registered or setting doesn't exist.
 *
 * @param path - Dot-notation path to the setting
 * @returns The setting value or undefined
 */
export function tryGetTypedSetting<P extends SettingPath>(path: P): SettingValue<P> | undefined {
  const service = tryGetSettingsManager<SettingsServiceLike>();
  if (!service) {
    return undefined;
  }
  return service.get<SettingValue<P>>(path);
}

/**
 * Try to set a setting value without throwing if service is unavailable.
 * Returns false if service is not registered, true if set successfully.
 *
 * @param path - Dot-notation path to the setting
 * @param value - New value
 * @returns Promise resolving to success status
 */
export async function trySetTypedSetting<P extends SettingPath>(
  path: P,
  value: SettingValue<P>
): Promise<boolean> {
  const service = tryGetSettingsManager<SettingsServiceLike>();
  if (!service) {
    return false;
  }
  await service.set(path, value);
  return true;
}

// =============================================================================
// Setting Key Type Guards
// =============================================================================

/**
 * Type guard to check if a string is a valid setting path.
 * Useful for runtime validation of dynamic keys.
 *
 * Note: This performs a basic structural check, not exhaustive validation.
 * For compile-time safety, prefer using SettingPath type directly.
 *
 * @param key - String to validate
 * @returns True if key matches setting path pattern
 */
export function isValidSettingPath(key: string): key is SettingPath {
  if (!__DEV__) {
    return true;
  }

  return Boolean(validSettingPaths?.has(key));
}

let validSettingPaths: ReadonlySet<string> | null = null;

if (__DEV__) {
  type UnknownRecord = Record<string, unknown>;

  const asUnknownRecord = (value: unknown): UnknownRecord => value as UnknownRecord;
  const isPlainObject = (value: unknown): value is UnknownRecord =>
    Boolean(value) && typeof value === 'object' && !Array.isArray(value);

  const collectDotPaths = (obj: UnknownRecord, prefix = ''): string[] => {
    const paths: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
      const current = prefix ? `${prefix}.${key}` : key;
      paths.push(current);

      if (isPlainObject(value)) {
        paths.push(...collectDotPaths(value, current));
      }
    }

    return paths;
  };

  const SETTINGS_PATH_SCHEMA: UnknownRecord = {
    ...asUnknownRecord(DEFAULT_SETTINGS),
    download: {
      ...asUnknownRecord(asUnknownRecord(DEFAULT_SETTINGS).download),
      // Optional settings are intentionally included for runtime validation.
      customTemplate: undefined,
    },
    tokens: {
      ...asUnknownRecord(asUnknownRecord(DEFAULT_SETTINGS).tokens),
      bearerToken: undefined,
      lastRefresh: undefined,
    },
  };

  validSettingPaths = new Set<string>(collectDotPaths(SETTINGS_PATH_SCHEMA));
}
