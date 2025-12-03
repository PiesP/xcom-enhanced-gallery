import type {
  AppSettings,
  NestedSettingKey,
  SettingChangeEvent,
} from '@features/settings/types/settings.types';
import { logger } from '@shared/logging';
import { getPersistentStorage } from '@shared/services/persistent-storage';
import {
  assignNestedPath,
  resolveNestedPath,
} from '@shared/utils/types/object-path';
import { cloneDeep } from '@shared/utils/types/safety';
import { APP_SETTINGS_STORAGE_KEY, createDefaultSettings, DEFAULT_SETTINGS } from '@/constants';
import { migrateSettings as runMigration } from './settings-migration';
import { computeCurrentSettingsSchemaHash } from './settings-schema';

export class SettingsService {
  private settings: AppSettings = createDefaultSettings();
  private readonly listeners = new Set<(event: SettingChangeEvent) => void>();
  private initialized = false;
  private readonly schemaHash = computeCurrentSettingsSchemaHash();
  private readonly storage = getPersistentStorage();

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

  isInitialized(): boolean {
    return this.initialized;
  }

  async cleanup(): Promise<void> {
    await this.saveSettings();
    this.listeners.clear();
    this.initialized = false;
  }

  getAllSettings(): Readonly<AppSettings> {
    return cloneDeep(this.settings);
  }

  get<T = unknown>(key: NestedSettingKey | string): T {
    const value = resolveNestedPath<T>(this.settings, key);
    return value === undefined
      ? (this.getDefaultValue(key as NestedSettingKey) as T)
      : value;
  }

  async set<T = unknown>(key: NestedSettingKey, value: T): Promise<void> {
    if (!this.isValid(key, value)) throw new Error(`Invalid setting value for ${key}`);

    const oldValue = this.get(key);
    assignNestedPath(this.settings, key, value);
    this.settings.lastModified = Date.now();

    this.notifyListeners({
      key,
      oldValue,
      newValue: value,
      timestamp: Date.now(),
      status: 'success',
    });
    await this.saveSettings();
  }

  async updateBatch(updates: Partial<Record<NestedSettingKey, unknown>>): Promise<void> {
    const entries = Object.entries(updates) as [NestedSettingKey, unknown][];
    for (const [key, value] of entries) {
      if (!this.isValid(key, value)) throw new Error(`Invalid setting value for ${key}`);
    }

    const timestamp = Date.now();
    entries.forEach(([key, value]) => {
      const oldValue = this.get(key);
      assignNestedPath(this.settings, key, value);
      this.notifyListeners({
        key,
        oldValue,
        newValue: value,
        timestamp,
        status: 'success',
      });
    });
    this.settings.lastModified = timestamp;
    await this.saveSettings();
  }

  async resetToDefaults(category?: keyof AppSettings): Promise<void> {
    const previous = this.getAllSettings();
    if (!category) {
      this.settings = createDefaultSettings();
    } else if (category in DEFAULT_SETTINGS) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.settings as any)[category] = cloneDeep(
        DEFAULT_SETTINGS[category as keyof typeof DEFAULT_SETTINGS],
      );
    }
    this.settings.lastModified = Date.now();
    this.notifyListeners({
      key: (category ?? 'all') as NestedSettingKey,
      oldValue: previous,
      newValue: this.getAllSettings(),
      timestamp: Date.now(),
      status: 'success',
    });
    await this.saveSettings();
  }

  subscribe(listener: (event: SettingChangeEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  exportSettings(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  async importSettings(jsonString: string): Promise<void> {
    try {
      const imported = JSON.parse(jsonString);
      if (!imported || typeof imported !== 'object') throw new Error('Invalid settings');

      const previous = this.getAllSettings();
      this.settings = runMigration(imported);
      this.settings.lastModified = Date.now();

      this.notifyListeners({
        key: 'all' as NestedSettingKey,
        oldValue: previous,
        newValue: this.getAllSettings(),
        timestamp: Date.now(),
        status: 'success',
      });
      await this.saveSettings();
    } catch (error) {
      logger.error('Settings import failed:', error);
      throw error;
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const stored = await this.storage.get<AppSettings & { __schemaHash?: string }>(
        APP_SETTINGS_STORAGE_KEY,
      );
      if (!stored) {
        await this.saveSettings();
        return;
      }

      if (stored.__schemaHash !== this.schemaHash) {
        this.settings = runMigration(stored);
        await this.saveSettings();
      } else {
        this.settings = runMigration(stored); // Ensure structure
      }
    } catch (error) {
      logger.error('Settings load failed, using defaults:', error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await this.storage.set(APP_SETTINGS_STORAGE_KEY, {
        ...this.settings,
        __schemaHash: this.schemaHash,
      });
    } catch (error) {
      logger.error('Settings save failed:', error);
    }
  }

  private isValid(key: NestedSettingKey, value: unknown): boolean {
    const def = this.getDefaultValue(key);
    if (def === undefined) return true;

    const type = Array.isArray(def) ? 'array' : typeof def;
    if (type === 'array') return Array.isArray(value);
    if (type === 'object') return typeof value === 'object' && value !== null;
    return typeof value === type;
  }

  private getDefaultValue(key: NestedSettingKey): unknown {
    return resolveNestedPath(DEFAULT_SETTINGS, key);
  }

  private notifyListeners(event: SettingChangeEvent): void {
    this.listeners.forEach((l) => {
      try {
        l(event);
      } catch (e) {
        logger.error('Listener error:', e);
      }
    });
  }
}
