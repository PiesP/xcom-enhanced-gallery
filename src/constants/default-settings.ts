/**
 * @fileoverview Default settings configuration.
 * @module constants/default-settings
 */

import type { AppSettings } from '@features/settings/types/settings.types';

/**
 * Static default application settings.
 *
 * Uses `as const satisfies AppSettings` for literal type preservation and type safety.
 * lastModified is 0 for deterministic hashing; use `createDefaultSettings()` for
 * runtime instances with actual timestamps.
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
  version: '1.7.1',
  lastModified: 0,
} as const satisfies AppSettings;

/**
 * Immutable default application settings.
 *
 * Exported for read-only access in validation and testing.
 * Use `createDefaultSettings()` to create mutable runtime instances.
 */
export const DEFAULT_SETTINGS = STATIC_DEFAULT_SETTINGS;

/**
 * Creates a new mutable settings object with a timestamp.
 *
 * Uses `globalThis.structuredClone` for deep cloning to ensure complete isolation
 * from the immutable source object.
 *
 * @param timestamp - Unix timestamp in milliseconds (defaults to current time)
 * @returns A deep clone of default settings with updated lastModified timestamp
 */
export function createDefaultSettings(timestamp: number = Date.now()): AppSettings {
  const settings = globalThis.structuredClone(DEFAULT_SETTINGS) as AppSettings;
  settings.lastModified = timestamp;
  return settings;
}
