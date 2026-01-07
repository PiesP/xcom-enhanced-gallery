/**
 * @fileoverview Settings migration helper - Versioned migration pipeline
 * @description Handles schema evolution: fills missing fields from defaults,
 * applies rename/transform steps between versions.
 *
 * This module is designed to be deterministic: callers must provide `nowMs`
 * (current epoch milliseconds) so that migrations stay pure and test-friendly.
 *
 * @example
 * ```typescript
 * const migrated = migrateSettings(userSettings, Date.now());
 * ```
 */

import { DEFAULT_SETTINGS } from '@constants/default-settings';
import type { AppSettings } from '@features/settings/types/settings.types';
import type { MigrationRegistry } from '@features/settings/types/settings-migration.types';
import { isRecord } from '@shared/utils/types/guards';

/**
 * Registry of versioned migrations for schema evolution.
 * Maps version strings to migration functions.
 *
 * @remarks
 * Currently includes Phase 447 migration for keyboard navigation fix.
 * Additional migrations can be added for future schema versions.
 */
const migrations: MigrationRegistry = {
  '1.0.0': (input): AppSettings => {
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
 *
 * @template T - Shape template type
 * @param input - Input value to prune
 * @param template - Template object defining allowed keys and structure
 * @returns Pruned object with only template-allowed keys
 *
 * @remarks
 * This function is deterministic and handles nested objects recursively.
 * Arrays within objects are not traversed; they are treated as leaf values.
 *
 * @example
 * ```typescript
 * const result = pruneWithTemplate(
 *   { allowed: 'value', unknown: 'field' },
 *   { allowed: '', other: '' }
 * );
 * // result = { allowed: 'value' }
 * ```
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
 * Fill missing fields by merging with defaults while preserving user values.
 * Unknown top-level and nested fields are pruned based on DEFAULT_SETTINGS shape.
 *
 * @param settings - User settings object (may contain unknown fields)
 * @param nowMs - Current timestamp in milliseconds for lastModified tracking
 * @returns Complete settings object with all required fields populated
 *
 * @remarks
 * This function:
 * 1. Prunes unknown fields using the default settings template
 * 2. Merges category-specific defaults with user values
 * 3. Updates lastModified timestamp
 * 4. Ensures all required fields are present (exactOptionalPropertyTypes safety)
 */
function fillWithDefaults(settings: AppSettings, nowMs: number): AppSettings {
  const pruned = pruneWithTemplate(settings, DEFAULT_SETTINGS) as Partial<AppSettings>;

  // Merge category defaults
  const categories = {
    gallery: DEFAULT_SETTINGS.gallery,
    toolbar: DEFAULT_SETTINGS.toolbar,
    download: DEFAULT_SETTINGS.download,
    tokens: DEFAULT_SETTINGS.tokens,
    accessibility: DEFAULT_SETTINGS.accessibility,
    features: DEFAULT_SETTINGS.features,
  } as const;

  const merged: Record<string, unknown> = { ...DEFAULT_SETTINGS, ...pruned };
  for (const [key, defaults] of Object.entries(categories)) {
    merged[key] = {
      ...defaults,
      ...(pruned[key as keyof typeof categories] ?? {}),
    };
  }

  return {
    ...merged,
    version: DEFAULT_SETTINGS.version,
    lastModified: nowMs,
  } as AppSettings;
}

/**
 * Migrate settings through versioned transformations and fill with defaults.
 *
 * Applies version-specific migrations (if defined) then ensures all required
 * fields are present by merging with defaults. Gracefully handles migration
 * errors by falling back to default filling without data loss.
 *
 * @param input - Settings object to migrate (may be from any version)
 * @param nowMs - Current timestamp in milliseconds for tracking last modification
 * @returns Migrated and validated settings object with all required fields
 *
 * @remarks
 * Migration process:
 * 1. Detect version from input.version
 * 2. Apply matching migration function if defined
 * 3. If migration throws, continue with error recovery (no data loss)
 * 4. Always perform fillWithDefaults for data integrity
 * 5. Update lastModified timestamp
 *
 * @example
 * ```typescript
 * const userSettings = loadSettings();
 * const migrated = migrateSettings(userSettings, Date.now());
 * // Settings now conform to current schema with all required fields
 * ```
 */
export function migrateSettings(input: AppSettings, nowMs: number): AppSettings {
  let working: AppSettings = { ...input };

  // Apply explicit migration if defined for detected version
  const currentVersion = input.version;
  const mig = migrations[currentVersion as keyof typeof migrations];
  if (typeof mig === 'function') {
    try {
      working = mig(working);
    } catch {
      /**
       * Intentionally ignored - migration errors should not prevent
       * settings restoration. Fall back to default filling instead.
       * This ensures user data preservation even with schema evolution issues.
       */
    }
  }

  // Always perform default fill/merge to ensure exactOptionalPropertyTypes safety
  return fillWithDefaults(working, nowMs);
}
