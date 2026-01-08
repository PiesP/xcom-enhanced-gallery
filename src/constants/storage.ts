/**
 * @fileoverview Storage key constants for persistent storage operations.
 *
 * Centralized string constants (`xeg-<category>-<name>`) for GM_setValue/GM_getValue.
 * Always use PersistentStorage service rather than direct GM_* calls.
 *
 * @module constants/storage
 */

/**
 * Storage key for application settings.
 *
 * Stores complete AppSettings object managed by SettingsService.
 * All modules reading/writing settings must use this key to prevent
 * data fragmentation and inconsistency.
 *
 * Data Structure: {@link AppSettings}
 *
 * @example
 * ```typescript
 * const storage = getPersistentStorage();
 * const settings = await storage.get<AppSettings>(APP_SETTINGS_STORAGE_KEY);
 * await storage.set(APP_SETTINGS_STORAGE_KEY, newSettings);
 * ```
 */
export const APP_SETTINGS_STORAGE_KEY = 'xeg-app-settings' as const;

/**
 * Type helper: Literal type for storage key string.
 *
 * @example
 * ```typescript
 * type SettingsKey = typeof APP_SETTINGS_STORAGE_KEY;
 * ```
 */
export type StorageKey = typeof APP_SETTINGS_STORAGE_KEY;

/**
 * Type helper: Union of all storage key values.
 *
 * Expands as new storage keys are added for exhaustive matching.
 */
export type StorageKeyValue = typeof APP_SETTINGS_STORAGE_KEY;
