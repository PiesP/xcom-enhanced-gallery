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
 * // Type-safe access with autocomplete
 * import { getTypedSettingOr, setTypedSetting } from '@shared/container/settings-access';
 * const count = getTypedSettingOr('gallery.preloadCount', 0); // Infers number
 * await setTypedSetting('gallery.theme', 'dark'); // Type-checked value
 * ```
 *
 * @example
 * ```typescript
 * // Using exported types for custom utilities
 * import type { SettingPath, SettingValue } from '@shared/container/settings-access';
 *
 * function createSettingValidator<P extends SettingPath>(
 *   path: P,
 *   validator: (value: SettingValue<P>) => boolean
 * ): (value: SettingValue<P>) => boolean {
 *   return validator;
 * }
 * ```
 */

// Re-export utility types for external consumers
export type {
  SettingPath,
  SettingValue,
} from './typed-settings';

// Re-export type-safe functions for convenient access
export {
  getTypedSettingOr,
  setTypedSetting,
} from './typed-settings';
