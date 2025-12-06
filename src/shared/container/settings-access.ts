/**
 * @fileoverview Strict settings service accessors.
 * @version 3.0.0 - Phase 403: Type-safe settings access
 *
 * Provides thin wrappers around the registered SettingsService. Unlike the
 * previous implementation these helpers do not swallow errors or provide
 * implicit fallbacks when the service is missing. Callers are expected to
 * register the SettingsService during bootstrap before importing these
 * helpers. If the service is unavailable an error is thrown so the fault is
 * visible during development.
 *
 * @example
 * ```typescript
 * // Legacy string-based access (still supported)
 * const count = getSetting<number>('gallery.preloadCount', 0);
 *
 * // NEW: Type-safe access with autocomplete
 * import { getTypedSettingOr, setTypedSetting } from '@shared/container/settings-access';
 * const count = getTypedSettingOr('gallery.preloadCount', 0); // Infers number
 * await setTypedSetting('gallery.theme', 'dark'); // Type-checked value
 * ```
 */
import { tryGetSettingsManager } from './service-accessors';

// Re-export type-safe functions for convenient access
export {
  getTypedSetting,
  getTypedSettingOr,
  isValidSettingPath,
  type SettingPath,
  type SettingValue,
  setTypedSetting,
  tryGetTypedSetting,
  trySetTypedSetting,
} from './typed-settings';

interface SettingsServiceLike {
  get<T = unknown>(key: string): T | undefined;
  set<T = unknown>(key: string, value: T): Promise<void>;
}

function requireSettingsService(): SettingsServiceLike {
  const service = tryGetSettingsManager<SettingsServiceLike>();
  if (!service) {
    throw new Error(
      'SettingsService is not registered. Ensure bootstrap registers it before usage.',
    );
  }
  return service;
}

/**
 * Get a setting value with string-based key.
 * @deprecated Use `getTypedSettingOr` for type-safe access
 */
export function getSetting<T>(key: string, fallback: T): T {
  const value = requireSettingsService().get<T>(key);
  return value === undefined ? fallback : value;
}

/**
 * Set a setting value with string-based key.
 * @deprecated Use `setTypedSetting` for type-safe access
 */
export function setSetting<T>(key: string, value: T): Promise<void> {
  return requireSettingsService().set(key, value);
}

export function tryGetSettingsService(): SettingsServiceLike | null {
  return tryGetSettingsManager<SettingsServiceLike>();
}
