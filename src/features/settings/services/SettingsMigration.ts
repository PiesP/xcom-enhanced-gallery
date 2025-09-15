/**
 * @fileoverview Settings migration helper
 * @description Versioned migration pipeline for AppSettings. Fills missing fields from defaults
 * and applies rename/transform steps between versions. Keep it pure for easy unit testing.
 */

import type { AppSettings } from '../types/settings.types';
import { DEFAULT_SETTINGS as defaultSettings } from '../types/settings.types';

type Migration = (input: AppSettings) => AppSettings;

// Registry for future explicit migrations (from older schemas to current)
// NOTE: Currently no breaking migrations defined; default fill/merge is sufficient.
const migrations: Partial<Record<string, Migration>> = {
  // '0.9.0': (input) => { /* example: rename keys, adjust ranges */ return input; },
};

/**
 * Fill missing fields by merging with defaults while preserving user values where present.
 */
function fillWithDefaults(settings: AppSettings): AppSettings {
  return {
    ...defaultSettings,
    ...settings,
    gallery: { ...defaultSettings.gallery, ...settings.gallery },
    download: { ...defaultSettings.download, ...settings.download },
    tokens: { ...defaultSettings.tokens, ...settings.tokens },
    performance: { ...defaultSettings.performance, ...settings.performance },
    accessibility: { ...defaultSettings.accessibility, ...settings.accessibility },
    version: defaultSettings.version, // always bump to latest
    lastModified: Date.now(),
  } as AppSettings;
}

/**
 * Apply version-specific transforms then fill with defaults.
 */
export function migrateSettings(input: AppSettings): AppSettings {
  let working = { ...input } as AppSettings;

  // Apply explicit migration if defined for the detected version
  const currentVersion = input.version;
  const mig = migrations[currentVersion as keyof typeof migrations];
  if (typeof mig === 'function') {
    try {
      working = mig(working);
    } catch {
      // If a migration throws, fall back to default filling to avoid data loss
    }
  }

  // Always perform default fill/merge to ensure exactOptionalPropertyTypes safety
  return fillWithDefaults(working);
}

export const __private = { fillWithDefaults };
