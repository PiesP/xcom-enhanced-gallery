/**
 * @fileoverview Default settings configuration
 */

import type { AppSettings } from '@features/settings/types/settings.types';

const STATIC_DEFAULT_SETTINGS = {
  gallery: {
    autoScrollSpeed: 5,
    infiniteScroll: true,
    preloadCount: 3,
    imageFitMode: 'fitWidth' as const,
    theme: 'auto' as const,
    animations: true,
    enableKeyboardNav: false,
  },
  toolbar: {
    /** Phase 268: Remove runtime warnings - toolbar settings schema */
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
  /** Phase 326.4: Conditional Feature Loading */
  features: {
    gallery: true, // Gallery feature enabled (required)
    settings: true, // Settings UI enabled
    download: true, // Download feature enabled
    mediaExtraction: true, // Media extraction enabled
    accessibility: true, // Accessibility features enabled
  },
  version: '1.0.0',
  // Static default retains deterministic timestamp for hashing comparisons
  lastModified: 0,
} as const satisfies AppSettings;

export const DEFAULT_SETTINGS = STATIC_DEFAULT_SETTINGS;

export function createDefaultSettings(timestamp: number = Date.now()): AppSettings {
  return {
    gallery: cloneValue(DEFAULT_SETTINGS.gallery),
    toolbar: cloneValue(DEFAULT_SETTINGS.toolbar),
    download: cloneValue(DEFAULT_SETTINGS.download),
    tokens: cloneValue(DEFAULT_SETTINGS.tokens),
    accessibility: cloneValue(DEFAULT_SETTINGS.accessibility),
    features: cloneValue(DEFAULT_SETTINGS.features),
    version: DEFAULT_SETTINGS.version,
    lastModified: timestamp,
  };
}

function cloneValue<T>(value: T): T {
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}
