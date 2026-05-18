/**
 * @fileoverview Settings configuration: defaults, storage key, and factory.
 * @module constants/settings
 */

import type { AppSettings } from '@shared/types/settings.types';

// ============================================================================
// Storage Key
// ============================================================================

export const APP_SETTINGS_STORAGE_KEY = 'xeg-app-settings' as const;

// ============================================================================
// Default Settings
// ============================================================================

export const DEFAULT_SETTINGS = {
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
  version: '2.1.0',
  lastModified: 0,
} as const satisfies AppSettings;

export function createDefaultSettings(timestamp: number = Date.now()): AppSettings {
  return globalThis.structuredClone({ ...DEFAULT_SETTINGS, lastModified: timestamp });
}
