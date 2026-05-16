/**
 * @fileoverview Settings schema hashing utilities
 * @description Compute stable hash of AppSettings shape to detect schema drift.
 */

/**
 * Manual schema hash.
 *
 * Bump this value whenever the persisted settings shape changes in a way that
 * should trigger a migration re-save.
 */
const SETTINGS_SCHEMA_HASH = '1';

/**
 * Returns the current settings schema hash version.
 *
 * This hash should be manually incremented when the persisted settings shape changes
 * in a way that requires migration or re-save. It serves as a schema version identifier.
 *
 * @returns The current schema hash version string
 */
export function computeCurrentSettingsSchemaHash(): string {
  return SETTINGS_SCHEMA_HASH;
}
