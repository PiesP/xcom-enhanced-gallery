/**
 * @fileoverview Settings migration helper
 * @description Versioned migration pipeline for AppSettings. Fills missing fields from defaults
 * and applies rename/transform steps between versions. Keep it pure for easy unit testing.
 */

import { isRecord } from '@shared/utils/type-guards';
import type { AppSettings } from '../types/settings.types';
import { DEFAULT_SETTINGS as defaultSettings } from '@/constants';

type Migration = (input: AppSettings) => AppSettings;

// Registry for future explicit migrations (from older schemas to current)
// NOTE: Currently no breaking migrations defined; default fill/merge is sufficient.
const migrations: Partial<Record<string, Migration>> = {
  // '0.9.0': (input) => { /* example: rename keys, adjust ranges */ return input; },
};

/**
 * Recursively prune unknown fields from input using the provided template as the allowed shape.
 * Only keys present in the template are retained; nested objects are pruned likewise.
 */
function pruneWithTemplate<T extends Record<string, unknown>>(
  input: unknown,
  template: T
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
 * Fill missing fields by merging with defaults while preserving user values where present.
 * Unknown top-level and nested fields are pruned based on the DEFAULT_SETTINGS shape.
 */
function fillWithDefaults(settings: AppSettings): AppSettings {
  const pruned = pruneWithTemplate(settings, defaultSettings) as Partial<AppSettings>;

  // 카테고리별 기본값 병합
  const categories = {
    gallery: defaultSettings.gallery,
    download: defaultSettings.download,
    tokens: defaultSettings.tokens,
    performance: defaultSettings.performance,
    accessibility: defaultSettings.accessibility,
  } as const;

  const merged: Record<string, unknown> = { ...defaultSettings, ...pruned };
  for (const [key, defaults] of Object.entries(categories)) {
    merged[key] = { ...defaults, ...(pruned[key as keyof typeof categories] ?? {}) };
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

export const __private = { fillWithDefaults, pruneWithTemplate };
