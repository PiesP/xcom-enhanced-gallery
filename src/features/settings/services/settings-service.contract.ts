/**
 * @fileoverview Settings service contract definition
 * @description Defines the interface for the settings management service that handles
 * application configuration, feature flags, and persistence.
 */

import type {
  AppSettings,
  FeatureFlags,
  NestedSettingKey,
  SettingChangeEvent,
} from '@features/settings/types/settings.types';
import type { BaseService } from '@shared/types/core/base-service.types';

/**
 * Immutable map of feature flags to their boolean states.
 *
 * Provides read-only access to feature flag states for runtime feature toggling.
 */
export type FeatureFlagMap = Readonly<Record<keyof FeatureFlags, boolean>>;

/**
 * Settings service contract for managing application settings and feature flags.
 *
 * This service provides a centralized interface for:
 * - Reading and writing application settings
 * - Managing feature flags
 * - Subscribing to setting changes
 * - Importing/exporting settings configurations
 * - Batch updates and default resets
 *
 * All setting operations are type-safe and support nested key paths.
 * Settings are automatically persisted to storage and synchronized across sessions.
 *
 * @extends BaseService - Inherits lifecycle management (initialize, destroy, isInitialized)
 */
export interface SettingsServiceContract extends BaseService {
  /**
   * Retrieves all application settings as an immutable snapshot.
   *
   * Returns a read-only deep copy of the current settings state. Modifications to
   * the returned object will not affect the internal settings state.
   *
   * @returns Immutable copy of complete application settings
   */
  getAllSettings(): Readonly<AppSettings>;

  /**
   * Retrieves a setting value by its nested key path.
   *
   * Supports dot-notation paths for accessing nested properties (e.g., "ui.theme").
   * The returned value is type-cast to the generic type parameter T for convenience,
   * but runtime type checking is not performed.
   *
   * @template T - Expected type of the setting value (defaults to unknown)
   * @param key - Nested key path or string identifier for the setting
   * @returns The setting value cast to type T
   *
   * @example
   * ```typescript
   * const theme = settings.get<string>('ui.theme');
   * const autoPlay = settings.get<boolean>('media.autoPlay');
   * ```
   */
  get<T = unknown>(key: NestedSettingKey | string): T;

  /**
   * Updates a single setting value and persists the change.
   *
   * The change is immediately persisted to storage and triggers change notifications
   * to all subscribers. The operation is asynchronous due to storage persistence.
   *
   * @template T - Type of the setting value
   * @param key - Nested key path identifying the setting to update
   * @param value - New value to set (must match the expected type for the key)
   * @returns Promise that resolves when the setting is persisted
   *
   * @example
   * ```typescript
   * await settings.set('ui.theme', 'dark');
   * await settings.set('media.autoPlay', false);
   * ```
   */
  set<T = unknown>(key: NestedSettingKey, value: T): Promise<void>;

  /**
   * Updates multiple settings atomically in a single batch operation.
   *
   * All updates are applied together and persisted as a single transaction.
   * Subscribers are notified once after all changes are applied. This is more
   * efficient than calling set() multiple times.
   *
   * @param updates - Partial map of nested keys to their new values
   * @returns Promise that resolves when all updates are persisted
   *
   * @example
   * ```typescript
   * await settings.updateBatch({
   *   'ui.theme': 'dark',
   *   'media.autoPlay': false,
   *   'gallery.fitMode': 'fitWidth'
   * });
   * ```
   */
  updateBatch(updates: Partial<Record<NestedSettingKey, unknown>>): Promise<void>;

  /**
   * Resets settings to their default values.
   *
   * If a category is specified, only settings within that category are reset.
   * If no category is provided, all settings are reset to defaults.
   * The operation is persisted and triggers change notifications.
   *
   * @param category - Optional settings category to reset (e.g., 'ui', 'media', 'gallery')
   * @returns Promise that resolves when the reset is persisted
   *
   * @example
   * ```typescript
   * await settings.resetToDefaults('ui');      // Reset only UI settings
   * await settings.resetToDefaults();          // Reset all settings
   * ```
   */
  resetToDefaults(category?: keyof AppSettings): Promise<void>;

  /**
   * Subscribes to setting change events.
   *
   * The listener is invoked whenever any setting value changes, receiving an event
   * object with details about the change (key, old value, new value).
   *
   * @param listener - Callback function invoked on setting changes
   * @returns Unsubscribe function to remove the listener
   *
   * @example
   * ```typescript
   * const unsubscribe = settings.subscribe((event) => {
   *   console.log(`Setting ${event.key} changed from ${event.oldValue} to ${event.newValue}`);
   * });
   *
   * // Later, to stop listening:
   * unsubscribe();
   * ```
   */
  subscribe(listener: (event: SettingChangeEvent) => void): () => void;

  /**
   * Exports all current settings as a JSON string.
   *
   * The exported format is suitable for backup, sharing, or migration purposes.
   * The JSON string includes all settings categories and values.
   *
   * @returns JSON string representation of all settings
   *
   * @example
   * ```typescript
   * const backup = settings.exportSettings();
   * localStorage.setItem('settings-backup', backup);
   * ```
   */
  exportSettings(): string;

  /**
   * Imports settings from a JSON string.
   *
   * Validates and applies settings from the provided JSON string. Invalid or
   * unrecognized settings are ignored. The operation is persisted and triggers
   * change notifications for all modified settings.
   *
   * @param jsonString - JSON string containing settings to import
   * @returns Promise that resolves when the import is complete and persisted
   * @throws {Error} If the JSON string is malformed or invalid
   *
   * @example
   * ```typescript
   * const backup = localStorage.getItem('settings-backup');
   * if (backup) {
   *   await settings.importSettings(backup);
   * }
   * ```
   */
  importSettings(jsonString: string): Promise<void>;

  /**
   * Retrieves the current feature flag states as an immutable map.
   *
   * Returns a read-only mapping of all feature flag names to their boolean states.
   * This is useful for checking multiple flags or displaying feature flag status.
   *
   * @returns Immutable map of feature flags to their current states
   *
   * @example
   * ```typescript
   * const flags = settings.getFeatureMap();
   * if (flags.experimentalUI) {
   *   enableExperimentalFeature();
   * }
   * ```
   */
  getFeatureMap(): FeatureFlagMap;
}
