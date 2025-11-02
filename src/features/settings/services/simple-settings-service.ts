/**
 * @fileoverview Simple Settings Service
 * @description Streamlined settings management with direct PersistentStorage usage
 */

import type { AppSettings, SettingChangeEvent, NestedSettingKey } from '../types/settings.types';
import { getPersistentStorage } from '@shared/services/persistent-storage';
import { logger } from '@shared/logging';
import { DEFAULT_SETTINGS as defaultSettings } from '@/constants';
import { computeCurrentSettingsSchemaHash } from './settings-schema';

/**
 * Settings change listener type
 */
type SettingChangeListener = (event: SettingChangeEvent) => void;

/**
 * Simplified Settings Service
 *
 * Direct PersistentStorage-based implementation:
 * - No migration system (simplicity)
 * - No Signal complexity (use subscribers instead)
 * - Minimal abstraction layers
 *
 * @example
 * ```typescript
 * const settings = SimpleSettingsService.getInstance();
 * await settings.initialize();
 * const speed = settings.get('gallery.autoScrollSpeed');
 * await settings.set('gallery.theme', 'dark');
 * ```
 */
export class SimpleSettingsService {
  private static instance: SimpleSettingsService | null = null;
  private readonly storage = getPersistentStorage();
  private settings!: AppSettings;
  private readonly listeners = new Set<SettingChangeListener>();
  private initialized = false;
  private readonly schemaHash: string = computeCurrentSettingsSchemaHash();
  private readonly storageKey = 'xeg-app-settings-v2';

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): SimpleSettingsService {
    if (!this.instance) {
      this.instance = new SimpleSettingsService();
    }
    return this.instance;
  }

  /**
   * Initialize service and load settings from storage
   */
  async initialize(): Promise<void> {
    try {
      // Load from storage or use defaults
      const stored = await this.storage.get<AppSettings>(this.storageKey);
      this.settings = stored ?? this.cloneDefaults();
      this.initialized = true;
      logger.debug('SimpleSettingsService initialized');
    } catch (error) {
      logger.error('SimpleSettingsService initialization failed:', error);
      this.settings = this.cloneDefaults();
      throw error;
    }
  }

  /**
   * Get initialization status
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Clean up service
   */
  async cleanup(): Promise<void> {
    try {
      await this.save();
      this.listeners.clear();
      this.initialized = false;
      logger.debug('SimpleSettingsService cleaned up');
    } catch (error) {
      logger.error('SimpleSettingsService cleanup failed:', error);
    }
  }

  /**
   * Get all settings (read-only copy)
   */
  getAllSettings(): Readonly<AppSettings> {
    return { ...this.settings };
  }

  /**
   * Get setting value by nested key
   *
   * @param key Setting key (dot notation: 'gallery.theme')
   * @returns Setting value or default
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
   * Set setting value by nested key
   *
   * @param key Setting key (dot notation: 'gallery.theme')
   * @param value New value
   */
  async set<T>(key: NestedSettingKey, value: T): Promise<void> {
    try {
      const oldValue = this.get(key);

      // Update nested value using functional approach
      const keys = key.split('.');
      if (keys.length === 0) {
        throw new Error(`Invalid setting key: ${key}`);
      }

      // Use spread operator to update object immutably
      const newSettings = JSON.parse(JSON.stringify(this.settings)) as AppSettings;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let current = newSettings as any;

      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!k) continue;
        if (!current[k] || typeof current[k] !== 'object') {
          current[k] = {};
        }
        current = current[k];
      }

      const finalKey = keys[keys.length - 1];
      if (finalKey) {
        current[finalKey] = value;
      }

      this.settings = newSettings;

      // Update timestamp
      this.settings.lastModified = Date.now();

      // Notify listeners
      this.notifyListeners({
        key,
        oldValue,
        newValue: value,
        timestamp: this.settings.lastModified,
      });

      // Auto-save to storage
      await this.save();

      logger.debug(`Setting updated: ${key}`);
    } catch (error) {
      logger.error(`Failed to set setting "${key}":`, error);
      throw error;
    }
  }

  /**
   * Save all settings to persistent storage
   */
  private async save(): Promise<void> {
    try {
      this.settings.lastModified = Date.now();
      // Use schemaHash for future versioning support
      if ('schemaVersion' in this.settings) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.settings as any).schemaVersion = this.schemaHash;
      }
      await this.storage.set(this.storageKey, this.settings);
    } catch (error) {
      logger.error('Failed to save settings:', error);
      throw error;
    }
  }

  /**
   * Subscribe to setting changes
   *
   * @param listener Change listener callback
   * @returns Unsubscribe function
   */
  subscribe(listener: SettingChangeListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Reset all settings to defaults
   */
  async resetToDefaults(): Promise<void> {
    try {
      this.settings = this.cloneDefaults();
      await this.save();
      logger.info('Settings reset to defaults');
    } catch (error) {
      logger.error('Failed to reset settings:', error);
      throw error;
    }
  }

  /**
   * Reset category to default
   *
   * @param category Category name
   */
  async resetCategory(category: keyof AppSettings): Promise<void> {
    try {
      const defaultCategory = defaultSettings[category];
      if (defaultCategory && typeof defaultCategory === 'object') {
        // Use JSON parse/stringify for deep copy to avoid TypeScript issues
        const cloned = JSON.parse(JSON.stringify(defaultCategory));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.settings as any)[category] = cloned;
        await this.save();
        logger.info(`Category reset to defaults: ${category}`);
      }
    } catch (error) {
      logger.error(`Failed to reset category "${category}":`, error);
      throw error;
    }
  }

  /**
   * Private helper: Clone default settings
   */
  private cloneDefaults(): AppSettings {
    return {
      ...defaultSettings,
      gallery: { ...defaultSettings.gallery },
      download: { ...defaultSettings.download },
      tokens: { ...defaultSettings.tokens },
      performance: { ...defaultSettings.performance },
      accessibility: { ...defaultSettings.accessibility },
      lastModified: Date.now(),
    } as AppSettings;
  }

  /**
   * Private helper: Get default value for key
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
   * Private helper: Notify all listeners
   */
  private notifyListeners(event: SettingChangeEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        logger.error('Settings listener error:', error);
      }
    }
  }
}

/**
 * Get singleton instance convenience function
 */
export function getSimpleSettingsService(): SimpleSettingsService {
  return SimpleSettingsService.getInstance();
}
