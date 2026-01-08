/**
 * Type-safe settings access using template literal types.
 * Provides compile-time type checking for dot-notation setting paths.
 */

import type { AppSettings } from '@features/settings/types/settings.types';
import { tryGetSettingsManager } from './service-accessors';

// =============================================================================
// Type Utilities for Dot-Notation Path Access
// =============================================================================

/** Generate all valid dot-notation paths for nested object types. */
type SettingPaths<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? `${Prefix}${K}` | SettingPaths<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

/** Extract value type at a given dot-notation path. */
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

export type SettingPath = SettingPaths<AppSettings>;
export type SettingValue<P extends SettingPath> = SettingValueAt<AppSettings, P>;

// =============================================================================
// Settings Service Interface
// =============================================================================

/** Minimal interface for settings service integration. */
interface SettingsServiceLike {
  get<T = unknown>(key: string): T | undefined;
  set<T = unknown>(key: string, value: T): Promise<void>;
}

/** Retrieve registered SettingsService or throw if not registered. */
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

export function getTypedSettingOr<P extends SettingPath>(
  path: P,
  fallback: SettingValue<P>
): SettingValue<P> {
  const value = requireSettingsService().get<SettingValue<P>>(path);
  return value === undefined ? fallback : value;
}

export function setTypedSetting<P extends SettingPath>(
  path: P,
  value: SettingValue<P>
): Promise<void> {
  return requireSettingsService().set(path, value);
}
