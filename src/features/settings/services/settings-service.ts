import { APP_SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS, createDefaultSettings } from '@/constants';
import type {
  AppSettings,
  NestedSettingKey,
  SettingChangeEvent,
} from '@features/settings/types/settings.types';
import { logger } from '@shared/logging';
import { getPersistentStorage } from '@shared/services/persistent-storage';
import { migrateSettings as runMigration } from './settings-migration';
import { computeCurrentSettingsSchemaHash } from './settings-schema';

function cloneDeep<T>(value: T): T {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveNestedValue(source: any, keys: string[]): any {
  return keys.reduce((acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), source);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function assignNestedValue(target: any, keys: string[], value: any): void {
  let current = target;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!key) continue;
    if (!current[key] || typeof current[key] !== 'object') current[key] = {};
    current = current[key];
  }
  const lastKey = keys[keys.length - 1];
  if (lastKey) current[lastKey] = value;
}

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
    const value = resolveNestedValue(this.settings, key.split('.'));
    return value === undefined
      ? (this.getDefaultValue(key as NestedSettingKey) as T)
      : (value as T);
  }

  async set<T = unknown>(key: NestedSettingKey, value: T): Promise<void> {
    if (!this.isValid(key, value)) throw new Error(`Invalid setting value for ${key}`);

    const oldValue = this.get(key);
    assignNestedValue(this.settings, key.split('.'), value);
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
      assignNestedValue(this.settings, key.split('.'), value);
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
        DEFAULT_SETTINGS[category as keyof typeof DEFAULT_SETTINGS]
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
        APP_SETTINGS_STORAGE_KEY
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
    return resolveNestedValue(DEFAULT_SETTINGS, key.split('.'));
  }

  private notifyListeners(event: SettingChangeEvent): void {
    this.listeners.forEach(l => {
      try {
        l(event);
      } catch (e) {
        logger.error('Listener error:', e);
      }
    });
  }
}
