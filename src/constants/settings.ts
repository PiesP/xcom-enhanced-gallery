// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

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
    preloadCount: 3,
    imageFitMode: 'fitWidth' as const,
    theme: 'auto' as const,
    animations: true,
    enableKeyboardNav: true,
    videoVolume: 1.0,
    videoMuted: false,
    videoClickMode: 'block-controls-only' as const,
  },
  toolbar: {
    autoHideDelay: 3000,
  },
  download: {},
  accessibility: {},
  features: {
    gallery: true,
    settings: true,
    download: true,
    mediaExtraction: true,
    accessibility: true,
  },
  version: '1',
  lastModified: 0,
} satisfies AppSettings;

export function createDefaultSettings(timestamp: number): AppSettings {
  return globalThis.structuredClone({ ...DEFAULT_SETTINGS, lastModified: timestamp });
}
