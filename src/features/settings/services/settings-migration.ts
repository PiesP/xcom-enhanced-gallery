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
 * Type Guard: Record<string, unknown> 타입 검증
 * Phase 141.2: 타입 안전성 개선
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Recursively prune unknown fields from input using the provided template as the allowed shape.
 * Only keys present in the template are retained; nested objects are pruned likewise.
 * Phase 141.2: 타입 가드 활용으로 타입 안전성 개선
 */
function pruneWithTemplate<T extends Record<string, unknown>>(
  input: unknown,
  template: T
): Partial<T> {
  // Phase 141.2: Type Guard로 타입 검증
  if (!isRecord(input)) return {} as Partial<T>;

  const out: Record<string, unknown> = {};

  for (const key of Object.keys(template) as Array<keyof T>) {
    const tplVal = template[key];
    const inVal = input[key as string];
    if (inVal === undefined) continue;

    // Phase 141.2: 중첩 객체는 재귀적으로 타입 가드 적용
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

  const gallery = {
    ...defaultSettings.gallery,
    ...(pruned.gallery ?? {}),
  };
  const download = {
    ...defaultSettings.download,
    ...(pruned.download ?? {}),
  };
  const tokens = {
    ...defaultSettings.tokens,
    ...(pruned.tokens ?? {}),
  };
  const performance = {
    ...defaultSettings.performance,
    ...(pruned.performance ?? {}),
  };
  const accessibility = {
    ...defaultSettings.accessibility,
    ...(pruned.accessibility ?? {}),
  };

  return {
    ...defaultSettings,
    ...pruned,
    gallery,
    download,
    tokens,
    performance,
    accessibility,
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

export const __private = { fillWithDefaults, pruneWithTemplate };
