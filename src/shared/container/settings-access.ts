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
 * // NEW: Type-safe access with autocomplete
 * import { getTypedSettingOr, setTypedSetting } from '@shared/container/settings-access';
 * const count = getTypedSettingOr('gallery.preloadCount', 0); // Infers number
 * await setTypedSetting('gallery.theme', 'dark'); // Type-checked value
 * ```
 */
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
