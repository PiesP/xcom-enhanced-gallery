/**
 * Storage key definitions shared across bootstrap and services.
 * @module constants/storage
 */

/**
 * Persistent storage key for the SettingsService payload.
 * All modules reading application settings from PersistentStorage must reuse this key
 * to avoid orphaned modules that store their own snapshots.
 */
export const APP_SETTINGS_STORAGE_KEY = 'xeg-app-settings';
