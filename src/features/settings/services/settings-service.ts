import { createDefaultSettings, DEFAULT_SETTINGS } from '@constants/default-settings';
import { migrateSettings } from '@features/settings/services/settings-migration';
import {
  PersistentSettingsRepository,
  type SettingsRepository,
} from '@features/settings/services/settings-repository';
import type {
  FeatureFlagMap,
  SettingsServiceContract,
} from '@features/settings/services/settings-service.contract';
import type {
  AppSettings,
  FeatureFlags,
  NestedSettingKey,
  SettingChangeEvent,
} from '@features/settings/types/settings.types';
import { logger } from '@shared/logging';
import type { Lifecycle } from '@shared/services/lifecycle';
import { createLifecycle } from '@shared/services/lifecycle';
import { createSingleton } from '@shared/utils/types/singleton';

const FORBIDDEN_PATH_KEYS = ['__proto__', 'constructor', 'prototype'] as const;

function isSafePathKey(key: string): boolean {
  return key !== '' && !FORBIDDEN_PATH_KEYS.includes(key as (typeof FORBIDDEN_PATH_KEYS)[number]);
}

function resolveNestedPath<T = unknown>(source: unknown, path: string): T | undefined {
  if (typeof path !== 'string' || path === '') {
    return undefined;
  }

  let current: unknown = source;
  const segments = path.split('.');

  for (const segment of segments) {
    if (!isSafePathKey(segment)) {
      return undefined;
    }
    if (current === null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return current as T | undefined;
}

function assignNestedPath(target: unknown, path: string, value: unknown): boolean {
  if (target === null || typeof target !== 'object') {
    return false;
  }
  if (typeof path !== 'string' || path === '') {
    return false;
  }

  const segments = path.split('.');

  // Reject missing last key (e.g. "a.")
  const last = segments[segments.length - 1];
  if (!last || !isSafePathKey(last)) {
    return false;
  }

  let current = target as Record<string, unknown>;

  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i];
    if (!segment || !isSafePathKey(segment)) {
      return false;
    }

    const existing = current[segment];
    if (existing === null || typeof existing !== 'object') {
      const next: Record<string, unknown> = {};
      current[segment] = next;
      current = next;
      continue;
    }

    current = existing as Record<string, unknown>;
  }

  current[last] = value;
  return true;
}

const FEATURE_DEFAULTS: Readonly<FeatureFlags> = Object.freeze({ ...DEFAULT_SETTINGS.features });

function normalizeFeatureFlags(
  features?: Partial<Record<keyof FeatureFlags, unknown>>
): FeatureFlagMap {
  const featureKeys = Object.keys(FEATURE_DEFAULTS) as Array<keyof FeatureFlags>;
  return featureKeys.reduce<Record<keyof FeatureFlags, boolean>>(
    (acc, key) => {
      const candidate = features?.[key];
      acc[key] = typeof candidate === 'boolean' ? candidate : FEATURE_DEFAULTS[key];
      return acc;
    },
    {} as Record<keyof FeatureFlags, boolean>
  );
}

export class SettingsService implements SettingsServiceContract {
  private readonly lifecycle: Lifecycle;
  private static readonly singleton = createSingleton(() => new SettingsService());

  public static getInstance(): SettingsService {
    return SettingsService.singleton.get();
  }

  /** @internal Test helper */
  public static resetForTests(): void {
    SettingsService.singleton.reset?.();
  }

  private settings: AppSettings = createDefaultSettings();
  private featureMap: FeatureFlagMap = normalizeFeatureFlags(this.settings.features);
  private readonly listeners = new Set<(event: SettingChangeEvent) => void>();

  constructor(
    private readonly repository: SettingsRepository = new PersistentSettingsRepository()
  ) {
    this.lifecycle = createLifecycle('SettingsService', {
      onInitialize: () => this.onInitialize(),
      onDestroy: () => this.onDestroy(),
    });
  }

  /** Initialize service (idempotent, fail-fast on error) */
  public async initialize(): Promise<void> {
    return this.lifecycle.initialize();
  }

  /** Destroy service (idempotent, graceful on error) */
  public destroy(): void {
    this.lifecycle.destroy();
  }

  /** Check if service is initialized */
  public isInitialized(): boolean {
    return this.lifecycle.isInitialized();
  }

  private async onInitialize(): Promise<void> {
    this.settings = await this.repository.load();
    this.refreshFeatureMap();
  }

  private onDestroy(): void {
    this.listeners.clear();
    this.repository.save(this.settings).catch((error) => {
      __DEV__ && logger.warn('Failed to save settings on destroy:', error);
    });
  }

  public getAllSettings(): Readonly<AppSettings> {
    this.assertInitialized();
    return globalThis.structuredClone(this.settings);
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

    if (!assignNestedPath(this.settings, key, value)) {
      throw new Error(`Failed to assign setting value for ${key}`);
    }
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

    // Capture a stable snapshot so per-key `oldValue` reflects the pre-batch state.
    // This also prevents intra-batch updates from affecting subsequent `oldValue` reads.
    const previous = globalThis.structuredClone(this.settings);

    const timestamp = Date.now();
    for (const [key, value] of entries) {
      if (!assignNestedPath(this.settings, key, value)) {
        throw new Error(`Failed to assign setting value for ${key}`);
      }
    }

    // Align ordering with `set()`: derived state is refreshed before notifying listeners.
    this.settings.lastModified = timestamp;
    this.refreshFeatureMap();

    for (const [key, value] of entries) {
      const oldValue = resolveNestedPath(previous, key);
      this.notifyListeners({
        key,
        oldValue,
        newValue: value,
        timestamp,
        status: 'success',
      });
    }

    await this.persist();
  }

  public async resetToDefaults(category?: keyof AppSettings): Promise<void> {
    this.assertInitialized();
    const previous = this.getAllSettings();
    if (!category) {
      this.settings = createDefaultSettings();
    } else if (category in DEFAULT_SETTINGS) {
      // Type-safe category reset with explicit assignment
      // Using intermediate object to avoid direct index signature issues
      const defaultValue = DEFAULT_SETTINGS[category as keyof typeof DEFAULT_SETTINGS];
      if (defaultValue !== undefined) {
        Object.assign(this.settings, { [category]: globalThis.structuredClone(defaultValue) });
      }
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
      const nowMs = Date.now();
      this.settings = migrateSettings(imported, nowMs);
      this.settings.lastModified = nowMs;
      this.refreshFeatureMap();

      this.notifyListeners({
        key: 'all' as NestedSettingKey,
        oldValue: previous,
        newValue: this.getAllSettings(),
        timestamp: nowMs,
        status: 'success',
      });
      await this.persist();
    } catch (error) {
      if (__DEV__) {
        logger.error('Settings import failed:', error);
      }
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
        if (__DEV__) {
          logger.error('Settings listener error:', error);
        }
      }
    });
  }

  private assertInitialized(): void {
    if (!this.isInitialized()) {
      throw new Error('SettingsService must be initialized before use');
    }
  }
}
