/**
 * @fileoverview Default settings configuration
 * @description Provides immutable default settings for the application and factory function
 * for creating runtime settings instances with timestamps
 * @module constants/default-settings
 */

import type { AppSettings } from '@features/settings/types/settings.types';

/**
 * Static default application settings
 *
 * @remarks
 * This object uses `as const satisfies AppSettings` to ensure:
 * - Literal type preservation for all const values
 * - Type safety against AppSettings interface
 * - Immutability through readonly properties
 *
 * The `lastModified` timestamp is set to 0 for deterministic hashing and comparisons.
 * Use `createDefaultSettings()` to generate runtime instances with actual timestamps.
 *
 * @internal
 */
const STATIC_DEFAULT_SETTINGS = {
  gallery: {
    autoScrollSpeed: 5,
    infiniteScroll: true,
    preloadCount: 3,
    imageFitMode: 'fitWidth' as const,
    theme: 'auto' as const,
    animations: true,
    enableKeyboardNav: true,
    videoVolume: 1.0,
    videoMuted: false,
  },
  toolbar: {
    autoHideDelay: 3000,
  },
  download: {
    filenamePattern: 'original' as const,
    imageQuality: 'original' as const,
    maxConcurrentDownloads: 3,
    autoZip: false,
    folderStructure: 'flat' as const,
  },
  tokens: {
    autoRefresh: true,
    expirationMinutes: 60,
  },
  accessibility: {
    reduceMotion: false,
    screenReaderSupport: true,
    focusIndicators: true,
  },
  features: {
    gallery: true,
    settings: true,
    download: true,
    mediaExtraction: true,
    accessibility: true,
  },
  version: '1.5.1',
  lastModified: 0,
} as const satisfies AppSettings;

/**
 * Immutable default application settings
 *
 * @remarks
 * Exported for direct read-only access in configuration, validation, and testing contexts.
 * Do not modify. Use `createDefaultSettings()` to create mutable runtime instances.
 *
 * @example
 * ```typescript
 * import { DEFAULT_SETTINGS } from '@constants/default-settings';
 *
 * // Read-only access for validation
 * if (userSettings.version !== DEFAULT_SETTINGS.version) {
 *   migrateSettings(userSettings);
 * }
 * ```
 *
 * @see {@link createDefaultSettings} for creating runtime instances
 */
export const DEFAULT_SETTINGS = STATIC_DEFAULT_SETTINGS;

/**
 * Creates a new mutable settings object with a timestamp
 *
 * @param timestamp - Unix timestamp in milliseconds (defaults to current time)
 * @returns A deep clone of default settings with updated lastModified timestamp
 *
 * @remarks
 * Uses `globalThis.structuredClone` for deep cloning to ensure complete isolation
 * from the immutable source object. The resulting object is fully mutable and safe
 * to modify without affecting DEFAULT_SETTINGS.
 *
 * @example
 * ```typescript
 * // Create with current timestamp
 * const userSettings = createDefaultSettings();
 *
 * // Create with specific timestamp (e.g., for testing)
 * const testSettings = createDefaultSettings(1672531200000);
 *
 * // Modify without affecting defaults
 * userSettings.gallery.theme = 'dark';
 * userSettings.lastModified = Date.now();
 * ```
 *
 * @see {@link DEFAULT_SETTINGS} for the immutable source object
 */
export function createDefaultSettings(timestamp: number = Date.now()): AppSettings {
  const settings = globalThis.structuredClone(DEFAULT_SETTINGS) as AppSettings;
  settings.lastModified = timestamp;
  return settings;
}
