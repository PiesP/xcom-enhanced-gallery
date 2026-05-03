/**
 * @fileoverview Settings configuration: defaults, storage key, and factory.
 * @module constants/settings
 */

import type { AppSettings } from '@features/settings/types/settings.types';

// ============================================================================
// Storage Key
// ============================================================================

export const APP_SETTINGS_STORAGE_KEY = 'xeg-app-settings' as const;

// ============================================================================
// Default Settings
// ============================================================================

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
  version: '1.9.1',
  lastModified: 0,
} as const satisfies AppSettings;

export const DEFAULT_SETTINGS = STATIC_DEFAULT_SETTINGS;

export function createDefaultSettings(timestamp: number = Date.now()): AppSettings {
  const settings = globalThis.structuredClone(DEFAULT_SETTINGS) as AppSettings;
  settings.lastModified = timestamp;
  return settings;
}
