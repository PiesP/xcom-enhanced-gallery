/**
 * @fileoverview Settings management service - Persistent storage, loading, validation
 * @description Handles application settings lifecycle: initialization, persistence, change events
 * @version 4.0.0 - Phase 354: PersistentStorage direct usage for simplification
 */

import { logger } from '@shared/logging';
import { getPersistentStorage } from '@shared/services/persistent-storage';
import { APP_SETTINGS_STORAGE_KEY } from '@/constants/storage';
import type {
  AppSettings,
  NestedSettingKey,
  SettingChangeEvent,
  SettingValidationResult,
} from '../types/settings.types';
import { DEFAULT_SETTINGS as defaultSettings, createDefaultSettings } from '@/constants';
import { migrateSettings as runMigration } from './settings-migration';
import { computeCurrentSettingsSchemaHash } from './settings-schema';

/**
 * Settings storage key
 */

type SettingsCategoryKey =
  | 'gallery'
  | 'toolbar'
  | 'download'
  | 'tokens'
  | 'accessibility'
  | 'features';

const SETTINGS_CATEGORY_KEYS: readonly SettingsCategoryKey[] = [
  'gallery',
  'toolbar',
  'download',
  'tokens',
  'accessibility',
  'features',
];

function cloneDeep<T>(value: T): T {
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function resolveNestedValue(source: unknown, keys: string[]): unknown {
  let value: unknown = source;

  for (const key of keys) {
    if (!key) continue;

    if (!value || typeof value !== 'object' || !(key in (value as Record<string, unknown>))) {
      return undefined;
    }

    value = (value as Record<string, unknown>)[key];
  }

  return value;
}

function assignNestedValue(target: Record<string, unknown>, keys: string[], value: unknown): void {
  let current = target;
  const lastIndex = keys.length - 1;

  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    if (!key) continue;

    if (index === lastIndex) {
      current[key] = value as unknown;
      return;
    }

    const next = current[key];
    if (!next || typeof next !== 'object') {
      current[key] = {};
    }

    current = current[key] as Record<string, unknown>;
  }
}

/**
 * Settings change event listener type
 */
type SettingChangeListener = (event: SettingChangeEvent) => void;

/**
 * Settings management service
 *
 * Capabilities:
 * - Persistent storage and loading (PersistentStorage direct usage)
 * - Type-safe settings access
 * - Change event system
 * - Settings validation
 * - Migration support
 *
 * @example
 * ```typescript
 * const service = new SettingsService();
 * await service.initialize();
 * const theme = service.get('gallery.theme');
 * await service.set('gallery.theme', 'dark');
 * ```
 */
export class SettingsService {
  // NOTE: Default settings contain nested objects, shallow copy can cause
  // set() to pollute defaultSettings.* (e.g., changing preloadCount modifies
  // defaultSettings.gallery.preloadCount). resetToDefaults(category) failure
  // was due to initial shallow copy causing set() to modify base objects directly.
  // Solution: Always use deep (structural) copy on initialization and reset.
  private settings: AppSettings = createDefaultSettings();
  private readonly listeners = new Set<SettingChangeListener>();
  private initialized = false;
  private readonly schemaHash = computeCurrentSettingsSchemaHash();
  private readonly storage = getPersistentStorage();

  /**
   * Initialize service - Load settings from storage
   */
  async initialize(): Promise<void> {
    try {
      await this.loadSettings();
      this.initialized = true;
      logger.debug('SettingsService initialized');
    } catch (error) {
      logger.error('SettingsService initialization failed:', error);
      throw error;
    }
  }

  /**
   * Check initialization status
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Cleanup service - Save and reset state
   */
  async cleanup(): Promise<void> {
    await this.saveSettings();
    this.listeners.clear();
    this.initialized = false;
    logger.debug('SettingsService cleanup complete');
  }

  /**
   * Get all settings
   *
   * @returns Current settings (read-only, deep copy)
   */
  getAllSettings(): Readonly<AppSettings> {
    return cloneDeep(this.settings);
  }

  /**
   * Get specific setting value by key
   *
   * @param key Setting key (dot notation supported)
   * @returns Setting value
   *
   * @example
   * ```typescript
   * const speed = settingsService.get('gallery.autoScrollSpeed');
   * const theme = settingsService.get('gallery.theme');
   * ```
   */
  get<T = unknown>(key: NestedSettingKey | string): T {
    const keys = key.split('.');
    const value = resolveNestedValue(this.settings, keys);

    if (value === undefined) {
      logger.warn(`Setting key not found: ${key}`);
      return this.getDefaultValue(key as NestedSettingKey) as T;
    }

    return value as T;
  }

  /**
   * Set specific setting value
   *
   * @param key Setting key
   * @param value New value
   *
   * @example
   * ```typescript
   * settingsService.set('gallery.autoScrollSpeed', 7);
   * settingsService.set('download.autoZip', true);
   * ```
   */
  async set<T = unknown>(key: NestedSettingKey, value: T): Promise<void> {
    const validation = this.validateSetting(key, value);
    if (!validation.valid) {
      throw new Error(`Invalid setting value: ${validation.error}`);
    }

    const oldValue = this.get(key);
    const keys = key.split('.');
    const timestamp = Date.now();

    assignNestedValue(this.settings as unknown as Record<string, unknown>, keys, value);
    this.settings.lastModified = timestamp;

    this.notifyListeners({
      key,
      oldValue,
      newValue: value,
      timestamp,
      status: 'success',
    });

    await this.saveSettings();

    logger.debug('Setting changed:', { key, value });
  }

  /**
   * Batch update multiple settings
   *
   * @param updates Settings update object
   *
   * @example
   * ```typescript
   * settingsService.updateBatch({
   *   'gallery.theme': 'dark',
   *   'download.autoZip': true
   * });
   * ```
   */
  async updateBatch(updates: Partial<Record<NestedSettingKey, unknown>>): Promise<void> {
    const entries = Object.entries(updates) as Array<[NestedSettingKey, unknown]>;
    if (entries.length === 0) {
      return;
    }

    for (const [key, value] of entries) {
      const validation = this.validateSetting(key, value);
      if (!validation.valid) {
        throw new Error(`Invalid setting value (${key}): ${validation.error}`);
      }
    }

    const timestamp = Date.now();
    const changes: SettingChangeEvent[] = [];

    for (const [key, value] of entries) {
      const oldValue = this.get(key);
      assignNestedValue(this.settings as unknown as Record<string, unknown>, key.split('.'), value);

      changes.push({
        key,
        oldValue,
        newValue: value,
        timestamp,
        status: 'success',
      });
    }

    this.settings.lastModified = timestamp;

    changes.forEach(change => this.notifyListeners(change));

    await this.saveSettings();

    logger.debug(`Batch settings update complete: ${entries.length} items`);
  }

  /**
   * Reset settings to defaults
   *
   * @param category Specific category to reset (optional)
   */
  async resetToDefaults(category?: keyof AppSettings): Promise<void> {
    const previous = this.getAllSettings();
    const timestamp = Date.now();

    if (!category) {
      this.settings = createDefaultSettings();
    } else if (SETTINGS_CATEGORY_KEYS.includes(category as SettingsCategoryKey)) {
      const defaults = cloneDeep(
        defaultSettings[category as SettingsCategoryKey]
      ) as AppSettings[typeof category];
      const settingsRecord = this.settings as unknown as Record<string, unknown>;
      settingsRecord[category as string] = defaults as unknown;
    } else if (category === 'version') {
      this.settings.version = defaultSettings.version;
    } else if (category === 'lastModified') {
      // lastModified handled below via timestamp assignment
    } else {
      logger.warn(`resetToDefaults: unknown category "${String(category)}" ignored`);
    }

    this.settings.lastModified = timestamp;

    const updated = this.getAllSettings();

    this.notifyListeners({
      key: (category ?? 'all') as NestedSettingKey,
      oldValue: previous,
      newValue: updated,
      timestamp,
      status: 'success',
    });

    await this.saveSettings();

    logger.info(`Settings reset complete: ${category ?? 'all'}`);
  }

  /**
   * Subscribe to setting changes
   *
   * @param listener Event listener
   * @returns Unsubscribe function
   */
  subscribe(listener: SettingChangeListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Export settings to JSON
   */
  exportSettings(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  /**
   * Import settings from JSON
   *
   * @param jsonString Settings JSON string
   */
  async importSettings(jsonString: string): Promise<void> {
    try {
      const importedSettings = JSON.parse(jsonString) as AppSettings;

      // Validate settings
      if (!this.validateSettingsStructure(importedSettings)) {
        throw new Error('Invalid settings structure');
      }

      // Perform migration if needed
      const migratedSettings = this.migrateSettings(importedSettings);
      const previous = this.getAllSettings();

      this.settings = migratedSettings;
      const timestamp = Date.now();
      this.settings.lastModified = timestamp;

      const updated = this.getAllSettings();

      this.notifyListeners({
        key: 'all' as NestedSettingKey,
        oldValue: previous,
        newValue: updated,
        timestamp,
        status: 'success',
      });

      await this.saveSettings();

      logger.info('Settings import complete');
    } catch (error) {
      logger.error('Settings import failed:', error);
      throw new Error('Unable to import settings. Please verify the format is correct.');
    }
  }

  // Private methods

  /**
   * Load settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      // Phase 431: PersistentStorage.get<T>() already performs JSON.parse(),
      // use returned object directly (prevent double parsing)
      type WithSchemaHash = AppSettings & { __schemaHash?: string };
      const stored = await this.storage.get<WithSchemaHash>(APP_SETTINGS_STORAGE_KEY);
      if (!stored) {
        logger.debug('No saved settings, using defaults');
        // Include current schema hash on first save for consistency
        await this.saveSettings();
        return;
      }

      const parsedSettings = stored;

      // Validate settings structure
      if (!this.validateSettingsStructure(parsedSettings)) {
        logger.warn('Invalid settings structure, restoring defaults');
        // Restore defaults and save (include hash)
        this.settings = createDefaultSettings();
        await this.saveSettings();
        return;
      }

      // Compare schema hash — force migration if mismatch
      const storedHash: string | undefined = parsedSettings.__schemaHash;
      const currentHash = this.schemaHash;

      if (!storedHash || storedHash !== currentHash) {
        logger.warn('Settings schema hash mismatch detected — performing migration');
        this.settings = runMigration(parsedSettings);
        await this.saveSettings();
      } else {
        // On hash match, still perform prune/fill once for safety (harmless)
        this.settings = runMigration(parsedSettings);
      }

      logger.debug('Settings loaded');
    } catch (error) {
      logger.error('Settings load failed, using defaults:', error);
    }
  }

  /**
   * Save settings to storage
   */
  private async saveSettings(): Promise<void> {
    try {
      // Ensure current schema hash before saving
      const withHash: AppSettings & { __schemaHash: string } = {
        ...this.settings,
        __schemaHash: this.schemaHash,
      };
      await this.storage.set(APP_SETTINGS_STORAGE_KEY, withHash);
      logger.debug('Settings saved');
    } catch (error) {
      logger.error('Settings save failed:', error);
    }
  }

  /**
   * Validate setting value
   */
  private validateSetting(key: NestedSettingKey, value: unknown): SettingValidationResult {
    const defaultValue = this.getDefaultValue(key);

    if (defaultValue !== undefined) {
      const expectedType = Array.isArray(defaultValue) ? 'array' : typeof defaultValue;

      switch (expectedType) {
        case 'boolean':
          if (typeof value !== 'boolean') {
            return {
              valid: false,
              error: 'This setting must be a true or false value',
              suggestion: 'Enter true or false',
            };
          }
          break;
        case 'number':
          if (typeof value !== 'number' || Number.isNaN(value)) {
            return {
              valid: false,
              error: 'This setting must be a numeric value',
              suggestion: 'Enter a valid number',
            };
          }
          break;
        case 'string':
          if (typeof value !== 'string') {
            return {
              valid: false,
              error: 'This setting must be a text value',
              suggestion: 'Enter a string value',
            };
          }
          break;
        case 'object':
          if (defaultValue !== null && (typeof value !== 'object' || value === null)) {
            return {
              valid: false,
              error: 'This setting expects an object value',
              suggestion: 'Provide an object with the appropriate shape',
            };
          }
          break;
        case 'array':
          if (!Array.isArray(value)) {
            return {
              valid: false,
              error: 'This setting expects a list value',
              suggestion: 'Provide an array value',
            };
          }
          break;
        default:
          break;
      }
    }

    // Speed-related settings validation
    if (key.includes('Speed') && typeof value === 'number') {
      if (value < 1 || value > 10) {
        return {
          valid: false,
          error: 'Speed must be between 1-10',
          suggestion: 'Enter a value between 1 and 10',
        };
      }
    }

    // Count-related settings validation
    if (key.includes('Count') && typeof value === 'number') {
      if (value < 0 || value > 20) {
        return {
          valid: false,
          error: 'Count must be between 0-20',
          suggestion: 'Enter a value between 0 and 20',
        };
      }
    }

    return { valid: true };
  }

  /**
   * Validate settings structure
   */
  private validateSettingsStructure(settings: unknown): boolean {
    if (!settings || typeof settings !== 'object' || settings === null) {
      return false;
    }

    const settingsObj = settings as Record<string, unknown>;

    return (
      'gallery' in settingsObj &&
      'toolbar' in settingsObj &&
      'download' in settingsObj &&
      'tokens' in settingsObj &&
      'accessibility' in settingsObj &&
      'features' in settingsObj &&
      'version' in settingsObj &&
      'lastModified' in settingsObj &&
      typeof settingsObj.lastModified === 'number'
    );
  }

  /**
   * Migrate settings
   */
  private migrateSettings(settings: AppSettings): AppSettings {
    return runMigration(settings);
  }

  /**
   * Get default value for key
   */
  private getDefaultValue(key: NestedSettingKey): unknown {
    return resolveNestedValue(defaultSettings, key.split('.'));
  }

  /**
   * Notify listeners of setting change events
   */
  private notifyListeners(event: SettingChangeEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        logger.error('Settings change listener error:', error);
      }
    });
  }
}
