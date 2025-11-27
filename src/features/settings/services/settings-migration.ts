/**
 * @fileoverview Settings migration helper - Versioned migration pipeline
 * @description Handles schema evolution: fills missing fields from defaults,
 * applies rename/transform steps between versions. Pure function for easy testing.
 */

import type { AppSettings } from '@features/settings/types/settings.types';
import { isRecord } from '@shared/utils/types/guards';
import { DEFAULT_SETTINGS as defaultSettings } from '@/constants';

type Migration = (input: AppSettings) => AppSettings;

// Registry for future explicit migrations (from older schemas to current)
// NOTE: Currently no breaking migrations defined; default fill/merge is sufficient.
const migrations: Partial<Record<string, Migration>> = {
  // Phase 447: Force-enable keyboard navigation after accidental default disablement
  '1.0.0': input => {
    const next = { ...input } as AppSettings;
    next.gallery = {
      ...next.gallery,
      enableKeyboardNav: true,
    };
    return next;
  },
  // '0.9.0': (input) => { /* example: rename keys, adjust ranges */ return input; },
};

/**
 * Recursively prune unknown fields from input using template as allowed shape.
 * Only keys present in template are retained; nested objects are pruned likewise.
 */
function pruneWithTemplate<T extends Record<string, unknown>>(
  input: unknown,
  template: T,
): Partial<T> {
  if (!isRecord(input)) return {} as Partial<T>;

  const out: Record<string, unknown> = {};

  for (const key of Object.keys(template) as Array<keyof T>) {
    const tplVal = template[key];
    const inVal = input[key as string];
    if (inVal === undefined) continue;

    if (isRecord(tplVal) && !Array.isArray(tplVal)) {
      out[key as string] = pruneWithTemplate(inVal, tplVal);
    } else {
      out[key as string] = inVal;
    }
  }
  return out as Partial<T>;
}

/**
 * Fill missing fields by merging with defaults while preserving user values.
 * Unknown top-level and nested fields are pruned based on DEFAULT_SETTINGS shape.
 */
function fillWithDefaults(settings: AppSettings): AppSettings {
  const pruned = pruneWithTemplate(settings, defaultSettings) as Partial<AppSettings>;

  // Merge category defaults
  const categories = {
    gallery: defaultSettings.gallery,
    toolbar: defaultSettings.toolbar,
    download: defaultSettings.download,
    tokens: defaultSettings.tokens,
    accessibility: defaultSettings.accessibility,
    features: defaultSettings.features,
  } as const;

  const merged: Record<string, unknown> = { ...defaultSettings, ...pruned };
  for (const [key, defaults] of Object.entries(categories)) {
    merged[key] = {
      ...defaults,
      ...(pruned[key as keyof typeof categories] ?? {}),
    };
  }

  return {
    ...merged,
    version: defaultSettings.version,
    lastModified: Date.now(),
  } as AppSettings;
}

/**
 * Apply version-specific transforms then fill with defaults.
 */
export function migrateSettings(input: AppSettings): AppSettings {
  let working = { ...input } as AppSettings;

  // Apply explicit migration if defined for detected version
  const currentVersion = input.version;
  const mig = migrations[currentVersion as keyof typeof migrations];
  if (typeof mig === 'function') {
    try {
      working = mig(working);
    } catch {
      // If migration throws, fall back to default filling to avoid data loss
    }
  }

  // Always perform default fill/merge to ensure exactOptionalPropertyTypes safety
  return fillWithDefaults(working);
}

export const __private = { fillWithDefaults, pruneWithTemplate };
