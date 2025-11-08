/**
 * @fileoverview Settings management service - Persistent storage, loading, validation
 * @description Handles application settings lifecycle: initialization, persistence, change events
 * @version 4.0.0 - Phase 354: PersistentStorage direct usage for simplification
 */

import { logger } from '@shared/logging';
import { isRecord, toRecord } from '@shared/utils/type-guards';
import { getPersistentStorage } from '@shared/services/persistent-storage';
import type {
  AppSettings,
  NestedSettingKey,
  SettingChangeEvent,
  SettingValidationResult,
} from '../types/settings.types';
import { DEFAULT_SETTINGS as defaultSettings } from '@/constants';
import { migrateSettings as runMigration } from './settings-migration';
import { computeCurrentSettingsSchemaHash } from './settings-schema';

/**
 * Settings storage key
 */
const STORAGE_KEY = 'xeg-app-settings';

/**
 * Settings change event listener type
 */
type SettingChangeListener = (event: SettingChangeEvent) => void;

/**
 * Set nested value helper - Navigate deep paths and set value
 */
function setNestedValue(target: Record<string, unknown>, keys: string[], value: unknown): void {
  for (let i = 0; i < keys.length - 1; i++) {
    const currentKey = keys[i];
    if (!currentKey) continue;

    if (!target[currentKey] || typeof target[currentKey] !== 'object') {
      target[currentKey] = {};
    }
    target = target[currentKey] as Record<string, unknown>;
  }

  const finalKey = keys[keys.length - 1];
  if (finalKey) {
    target[finalKey] = value;
  }
}

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
  private settings: AppSettings = SettingsService.cloneDefaults();
  private readonly listeners = new Set<SettingChangeListener>();
  private initialized = false;
  private readonly schemaHash = computeCurrentSettingsSchemaHash();
  private readonly storage = getPersistentStorage();

  /** Clone default settings (1-level depth - separate category objects) */
  private static cloneDefaults(): AppSettings {
    return {
      ...defaultSettings,
      gallery: { ...defaultSettings.gallery },
      download: { ...defaultSettings.download },
      tokens: { ...defaultSettings.tokens },
      performance: { ...defaultSettings.performance },
      accessibility: { ...defaultSettings.accessibility },
      // lastModified is reset with new timestamp
      lastModified: Date.now(),
    } as AppSettings;
  }

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
    return JSON.parse(JSON.stringify(this.settings)) as AppSettings;
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
  get<T = unknown>(key: NestedSettingKey): T {
    const keys = key.split('.');
    let value: unknown = this.settings;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        logger.warn(`Setting key not found: ${key}`);
        return this.getDefaultValue(key) as T;
      }
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

    setNestedValue(toRecord(this.settings), keys, value);
    this.settings.lastModified = Date.now();

    // Emit change event
    this.notifyListeners({
      key,
      oldValue,
      newValue: value,
      timestamp: Date.now(),
      status: 'success',
    });

    // Immediate save (critical settings)
    if (this.isCriticalSetting(key)) {
      await this.saveSettings();
    }

    logger.debug(`Setting changed: ${key} = ${value}`);
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
   *   'download.autoZip': true,
   *   'performance.debugMode': false
   * });
   * ```
   */
  async updateBatch(updates: Partial<Record<NestedSettingKey, unknown>>): Promise<void> {
    const changes: SettingChangeEvent[] = [];

    // Validate all changes
    for (const [key, value] of Object.entries(updates)) {
      const validation = this.validateSetting(key as NestedSettingKey, value);
      if (!validation.valid) {
        throw new Error(`Invalid setting value (${key}): ${validation.error}`);
      }
    }

    // Batch update
    for (const [key, value] of Object.entries(updates)) {
      const oldValue = this.get(key as NestedSettingKey);
      const keys = key.split('.');
      setNestedValue(toRecord(this.settings), keys, value);

      changes.push({
        key: key as NestedSettingKey,
        oldValue,
        newValue: value,
        timestamp: Date.now(),
        status: 'success',
      });
    }

    this.settings.lastModified = Date.now();

    // Emit all change events
    changes.forEach(change => this.notifyListeners(change));

    // Save
    await this.saveSettings();

    logger.debug(`Batch settings update complete: ${Object.keys(updates).length} items`);
  }

  /**
   * Reset settings to defaults
   *
   * @param category Specific category to reset (optional)
   */
  async resetToDefaults(category?: keyof AppSettings): Promise<void> {
    const oldSettings = { ...this.settings };

    if (category) {
      // Phase 141.1: Type Guard based safe category reset (removed double assertion)
      const defaultsRecord = toRecord(defaultSettings);
      const categoryDefaults = defaultsRecord[category as string];

      if (isRecord(categoryDefaults)) {
        const cloned = { ...categoryDefaults };
        const settingsRecord = toRecord(this.settings);
        settingsRecord[category] = cloned;
      }
    } else {
      // Full reset uses safe deep clone
      this.settings = SettingsService.cloneDefaults();
    }

    this.settings.lastModified = Date.now();

    // Emit change event
    const resetKey = category || 'all';
    this.notifyListeners({
      key: resetKey as NestedSettingKey,
      oldValue: oldSettings,
      newValue: this.settings,
      timestamp: Date.now(),
      status: 'success',
    });

    await this.saveSettings();

    logger.info(`Settings reset complete: ${category || 'all'}`);
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

      const oldSettings = { ...this.settings };
      this.settings = migratedSettings;
      this.settings.lastModified = Date.now();

      // Emit change event
      this.notifyListeners({
        key: 'all' as NestedSettingKey,
        oldValue: oldSettings,
        newValue: this.settings,
        timestamp: Date.now(),
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
      const stored = await this.storage.get<WithSchemaHash>(STORAGE_KEY);
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
        this.settings = SettingsService.cloneDefaults();
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
      } as AppSettings & { __schemaHash: string };
      await this.storage.set(STORAGE_KEY, JSON.stringify(withHash));
      logger.debug('Settings saved');
    } catch (error) {
      logger.error('Settings save failed:', error);
    }
  }

  /**
   * Validate setting value
   */
  private validateSetting(key: NestedSettingKey, value: unknown): SettingValidationResult {
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

    // Boolean values validation
    if (key.includes('enabled') || key.includes('auto') || key.includes('show')) {
      if (typeof value !== 'boolean') {
        return {
          valid: false,
          error: 'This setting must be a true or false value',
          suggestion: 'Enter true or false',
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
      'download' in settingsObj &&
      'tokens' in settingsObj &&
      'performance' in settingsObj &&
      'accessibility' in settingsObj &&
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
    const keys = key.split('.');
    let value: unknown = defaultSettings;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Check if setting is critical (requires immediate save)
   */
  private isCriticalSetting(key: NestedSettingKey): boolean {
    const criticalSettings = [
      'tokens.bearerToken',
      'performance.debugMode',
      'accessibility.reduceMotion',
    ];

    return criticalSettings.includes(key);
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
