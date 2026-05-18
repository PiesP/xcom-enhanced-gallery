import { createDefaultSettings, DEFAULT_SETTINGS } from '@constants/settings';
import {
  PersistentSettingsRepository,
  type SettingsRepository,
} from '@features/settings/services/settings-repository';
import { logger } from '@shared/logging/logger';
import type {
  AppSettings,
  NestedSettingKey,
  SettingChangeEvent,
} from '@shared/types/settings.types';
import { assignNestedPath, isValidSettingValue, resolveNestedPath } from './settings-helpers';

let _settingsInstance: SettingsService | null = null;

export class SettingsService {
  private _initialized = false;

  public static getInstance(): SettingsService {
    if (!_settingsInstance) _settingsInstance = new SettingsService();
    return _settingsInstance;
  }

  /** @internal Test helper */
  public static resetForTests(): void {
    _settingsInstance = null;
  }

  private settings: AppSettings = createDefaultSettings();
  private readonly listeners = new Set<(event: SettingChangeEvent) => void>();

  constructor(
    private readonly repository: SettingsRepository = new PersistentSettingsRepository()
  ) {}

  public async initialize(): Promise<void> {
    if (this._initialized) return;
    this.settings = await this.repository.load();
    this._initialized = true;
  }

  public destroy(): void {
    if (!this._initialized) return;
    this.listeners.clear();
    this._initialized = false;
  }

  public isInitialized(): boolean {
    return this._initialized;
  }

  public get(key: NestedSettingKey | string): unknown {
    const value = resolveNestedPath(this.settings, key);
    return value === undefined ? this.getDefaultValue(key) : value;
  }

  public async set<T = unknown>(key: NestedSettingKey, value: T): Promise<void> {
    if (!isValidSettingValue(this.getDefaultValue(key), value)) {
      throw new Error(`Invalid setting value for ${key}`);
    }

    const oldValue = this.get(key);

    if (!assignNestedPath(this.settings, key, value)) {
      throw new Error(`Failed to assign setting value for ${key}`);
    }
    this.settings.lastModified = performance.now();

    this.notifyListeners({
      key,
      oldValue,
      newValue: value,
      timestamp: performance.now(),
      status: 'success',
    });
    await this.persist();
  }

  public subscribe(listener: (event: SettingChangeEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private async persist(): Promise<void> {
    await this.repository.save(this.settings);
  }

  private getDefaultValue(key: string): unknown {
    return resolveNestedPath(DEFAULT_SETTINGS, key);
  }

  private notifyListeners(event: SettingChangeEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        if (__DEV__) logger.error('Settings listener error:', error);
      }
    }
  }
}
