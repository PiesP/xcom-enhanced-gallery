import { createDefaultSettings, DEFAULT_SETTINGS } from '@constants';
import type {
  AppSettings,
  FeatureFlags,
  NestedSettingKey,
  SettingChangeEvent,
} from '@features/settings/types/settings.types';
import { logger } from '@shared/logging';
import { BaseServiceImpl } from '@shared/services/base-service';
import { assignNestedPath, resolveNestedPath } from '@shared/utils/types/object-path';
import { cloneDeep } from '@shared/utils/types/safety';
import { migrateSettings } from './settings-migration';
import { PersistentSettingsRepository, type SettingsRepository } from './settings-repository';
import type { FeatureFlagMap, SettingsServiceContract } from './settings-service.contract';

const FEATURE_DEFAULTS: Readonly<FeatureFlags> = Object.freeze({ ...DEFAULT_SETTINGS.features });

function normalizeFeatureFlags(
  features?: Partial<Record<keyof FeatureFlags, unknown>>,
): FeatureFlagMap {
  const featureKeys = Object.keys(FEATURE_DEFAULTS) as Array<keyof FeatureFlags>;
  return featureKeys.reduce<Record<keyof FeatureFlags, boolean>>(
    (acc, key) => {
      const candidate = features?.[key];
      acc[key] = typeof candidate === 'boolean' ? candidate : FEATURE_DEFAULTS[key];
      return acc;
    },
    {} as Record<keyof FeatureFlags, boolean>,
  );
}

export class SettingsService extends BaseServiceImpl implements SettingsServiceContract {
  private static instance: SettingsService | null = null;

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  private settings: AppSettings = createDefaultSettings();
  private featureMap: FeatureFlagMap = normalizeFeatureFlags(this.settings.features);
  private readonly listeners = new Set<(event: SettingChangeEvent) => void>();

  constructor(
    private readonly repository: SettingsRepository = new PersistentSettingsRepository(),
  ) {
    super('SettingsService');
  }

  protected async onInitialize(): Promise<void> {
    this.settings = await this.repository.load();
    this.refreshFeatureMap();
  }

  protected onDestroy(): void {
    this.listeners.clear();
    void this.repository.save(this.settings);
  }

  public getAllSettings(): Readonly<AppSettings> {
    this.assertInitialized();
    return cloneDeep(this.settings);
  }

  public get<T = unknown>(key: NestedSettingKey | string): T {
    this.assertInitialized();
    const value = resolveNestedPath<T>(this.settings, key);
    return value === undefined ? (this.getDefaultValue(key as NestedSettingKey) as T) : value;
  }

  public async set<T = unknown>(key: NestedSettingKey, value: T): Promise<void> {
    this.assertInitialized();
    if (!this.isValid(key, value)) throw new Error(`Invalid setting value for ${key}`);

    const oldValue = this.get(key);
    assignNestedPath(this.settings, key, value);
    this.settings.lastModified = Date.now();

    this.refreshFeatureMap();
    this.notifyListeners({
      key,
      oldValue,
      newValue: value,
      timestamp: Date.now(),
      status: 'success',
    });
    await this.persist();
  }

  public async updateBatch(updates: Partial<Record<NestedSettingKey, unknown>>): Promise<void> {
    this.assertInitialized();
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
    this.refreshFeatureMap();
    await this.persist();
  }

  public async resetToDefaults(category?: keyof AppSettings): Promise<void> {
    this.assertInitialized();
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
    this.refreshFeatureMap();
    this.notifyListeners({
      key: (category ?? 'all') as NestedSettingKey,
      oldValue: previous,
      newValue: this.getAllSettings(),
      timestamp: Date.now(),
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

  public exportSettings(): string {
    this.assertInitialized();
    return JSON.stringify(this.settings, null, 2);
  }

  public async importSettings(jsonString: string): Promise<void> {
    this.assertInitialized();
    try {
      const imported = JSON.parse(jsonString);
      if (!imported || typeof imported !== 'object') throw new Error('Invalid settings');

      const previous = this.getAllSettings();
      this.settings = migrateSettings(imported);
      this.settings.lastModified = Date.now();
      this.refreshFeatureMap();

      this.notifyListeners({
        key: 'all' as NestedSettingKey,
        oldValue: previous,
        newValue: this.getAllSettings(),
        timestamp: Date.now(),
        status: 'success',
      });
      await this.persist();
    } catch (error) {
      logger.error('Settings import failed:', error);
      throw error;
    }
  }

  public getFeatureMap(): FeatureFlagMap {
    this.assertInitialized();
    return Object.freeze({ ...this.featureMap });
  }

  private refreshFeatureMap(): void {
    this.featureMap = normalizeFeatureFlags(this.settings.features);
  }

  private async persist(): Promise<void> {
    await this.repository.save(this.settings);
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
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        logger.error('Settings listener error:', error);
      }
    });
  }

  private assertInitialized(): void {
    if (!this.isInitialized()) {
      throw new Error('SettingsService must be initialized before use');
    }
  }
}
