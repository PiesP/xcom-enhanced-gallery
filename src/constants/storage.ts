/**
 * @fileoverview Storage key constants for persistent storage operations
 * @description Centralized string constants for GM_setValue/GM_getValue operations.
 * Prevents key conflicts and ensures consistent storage access across the application.
 * @module constants/storage
 *
 * @remarks
 * **Key Naming Convention**:
 * - Pattern: `xeg-<category>-<name>` (kebab-case)
 * - Prefix: `xeg-` (namespace to avoid conflicts with other userscripts)
 * - Category: Broad functional area (app, cache, temp)
 * - Name: Specific data identifier (lowercase, descriptive)
 *
 * **Storage Access Pattern**:
 * Always use PersistentStorage service rather than direct GM_* calls:
 * ```typescript
 * import { getPersistentStorage } from '@shared/services/persistent-storage';
 * const storage = getPersistentStorage();
 * await storage.set(APP_SETTINGS_STORAGE_KEY, settings);
 * ```
 *
 * **Key Reuse Requirement**:
 * All modules must reuse defined keys to prevent data fragmentation.
 * Creating duplicate keys for the same data creates orphaned storage entries.
 *
 * @example
 * ```typescript
 * import { APP_SETTINGS_STORAGE_KEY } from '@constants/storage';
 * import { getPersistentStorage } from '@shared/services/persistent-storage';
 *
 * // Read settings
 * const storage = getPersistentStorage();
 * const settings = await storage.get<AppSettings>(APP_SETTINGS_STORAGE_KEY);
 *
 * // Write settings
 * await storage.set(APP_SETTINGS_STORAGE_KEY, newSettings);
 * ```
 *
 * @see {@link PersistentStorage} for storage service implementation
 * @see {@link SettingsService} for settings management
 */

/**
 * Storage key for application settings
 *
 * @remarks
 * This key stores the complete application settings object managed by SettingsService.
 * All modules reading or writing application settings must use this key to ensure
 * data consistency and prevent orphaned storage entries.
 *
 * **Data Structure**: {@link AppSettings}
 *
 * **Access Pattern**:
 * - Read: SettingsService loads on initialization
 * - Write: SettingsService persists on settings change
 * - Format: Serialized JSON object
 *
 * **Key Reuse Critical**:
 * Multiple modules storing settings independently creates:
 * - Data inconsistency between modules
 * - Orphaned storage entries
 * - Merge conflicts during updates
 * - Difficulty tracking source of truth
 *
 * @example
 * ```typescript
 * import { APP_SETTINGS_STORAGE_KEY } from '@constants/storage';
 * import { getPersistentStorage } from '@shared/services/persistent-storage';
 * import type { AppSettings } from '@features/settings/types/settings.types';
 *
 * // SettingsService initialization pattern
 * const storage = getPersistentStorage();
 * const stored = await storage.get<AppSettings>(APP_SETTINGS_STORAGE_KEY);
 *
 * // Merge with defaults if needed
 * const settings = stored ?? createDefaultSettings();
 *
 * // Save updated settings
 * await storage.set(APP_SETTINGS_STORAGE_KEY, settings);
 * ```
 *
 * @see {@link AppSettings} for settings structure
 * @see {@link SettingsService} for settings lifecycle management
 */
export const APP_SETTINGS_STORAGE_KEY = 'xeg-app-settings' as const;

// ============================================================================
// Type Helpers
// ============================================================================

/**
 * Type helper: Extract storage key string type
 *
 * @remarks
 * Provides literal type for type-safe storage operations.
 * Use when you need a typed reference to the storage key string.
 *
 * @example
 * ```typescript
 * type SettingsKey = typeof APP_SETTINGS_STORAGE_KEY;
 * // 'xeg-app-settings'
 *
 * function loadFromStorage(key: SettingsKey): Promise<AppSettings | null> {
 *   const storage = getPersistentStorage();
 *   return storage.get<AppSettings>(key);
 * }
 * ```
 */
export type StorageKey = typeof APP_SETTINGS_STORAGE_KEY;

/**
 * Type helper: Union of all storage key values
 *
 * @remarks
 * Useful for exhaustive matching or validation of storage operations.
 * Automatically expands as new storage keys are added.
 *
 * @example
 * ```typescript
 * type AllKeys = StorageKeyValue;
 * // Currently: 'xeg-app-settings'
 *
 * function isValidStorageKey(key: string): key is StorageKeyValue {
 *   const validKeys: readonly StorageKeyValue[] = [APP_SETTINGS_STORAGE_KEY];
 *   return validKeys.includes(key as StorageKeyValue);
 * }
 * ```
 */
export type StorageKeyValue = typeof APP_SETTINGS_STORAGE_KEY;
