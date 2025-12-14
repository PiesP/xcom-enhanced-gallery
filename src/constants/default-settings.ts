/**
 * @fileoverview Default settings configuration
 */

import type { AppSettings } from '@features/settings/types/settings.types';
import { cloneDeep } from '@shared/utils/types/safety';

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
    autoHideDelay: 3000, // ms, toolbar auto-hide delay (default 3s)
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
    gallery: true, // Gallery feature enabled (required)
    settings: true, // Settings UI enabled
    download: true, // Download feature enabled
    mediaExtraction: true, // Media extraction enabled
    accessibility: true, // Accessibility features enabled
  },
  version: '1.2.1',
  // Static default retains deterministic timestamp for hashing comparisons
  lastModified: 0,
} as const satisfies AppSettings;

export const DEFAULT_SETTINGS = STATIC_DEFAULT_SETTINGS;

export function createDefaultSettings(timestamp: number = Date.now()): AppSettings {
  return {
    gallery: cloneDeep(DEFAULT_SETTINGS.gallery),
    toolbar: cloneDeep(DEFAULT_SETTINGS.toolbar),
    download: cloneDeep(DEFAULT_SETTINGS.download),
    tokens: cloneDeep(DEFAULT_SETTINGS.tokens),
    accessibility: cloneDeep(DEFAULT_SETTINGS.accessibility),
    features: cloneDeep(DEFAULT_SETTINGS.features),
    version: DEFAULT_SETTINGS.version,
    lastModified: timestamp,
  };
}
