// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { createDefaultSettings, DEFAULT_SETTINGS } from '@constants/settings';
import {
  PersistentSettingsRepository,
  type SettingsRepository,
} from '@features/settings/services/settings-repository';
import { logger } from '@shared/logging/logger';
import { createSingleton } from '@shared/services/singleton-base';
import type {
  AppSettings,
  NestedSettingKey,
  SettingChangeEvent,
} from '@shared/types/settings.types';
import { resolveNestedPath } from '@shared/utils/object/path';
import { SETTINGS_LEAF_KEYS, validateSettingValue } from './settings-validation';

export class SettingsService {
  private _initialized = false;

  private settings: AppSettings = createDefaultSettings(Date.now());
  private readonly listeners = new Set<(event: SettingChangeEvent) => void>();
  private readonly persistenceListeners = new Set<(unsaved: boolean) => void>();
  private updateQueue: Promise<void> = Promise.resolve();
  private unsaved = false;
  /** Only explicit user edits are eligible for retry after a failed read or write. */
  private readonly pendingChanges = new Map<string, unknown>();
  private baselineAvailable = true;
  private generation = 0;

  constructor(
    private readonly repository: SettingsRepository = new PersistentSettingsRepository()
  ) {}

  public async initialize(): Promise<void> {
    if (this._initialized) {
      return;
    }
    // A same-document SPA restart must not discard a denied local edit. A real
    // document reload creates a fresh service and reads durable storage again.
    if (this.unsaved && !this.repository.loadState) {
      this._initialized = true;
      return;
    }
    const generation = this.generation;
    const result = this.repository.loadState
      ? await this.repository.loadState()
      : { settings: await this.repository.load(), available: true };
    if (generation !== this.generation) {
      return;
    }
    this.settings = result.settings;
    for (const [key, value] of this.pendingChanges) {
      this.assignNestedPath(this.settings, key, value);
    }
    this.baselineAvailable = result.available;
    this.setUnsaved(!result.available || this.pendingChanges.size > 0);
    this._initialized = true;
  }

  public destroy(): void {
    this.listeners.clear();
    this.persistenceListeners.clear();
    this._initialized = false;
    this.generation++;
  }

  /** Wait for queued writes, then reset lifecycle state for a fresh repository load. */
  public async prepareForRestart(): Promise<void> {
    await this.updateQueue;
    this.destroy();
  }

  public isInitialized(): boolean {
    return this._initialized;
  }

  public get(key: NestedSettingKey | string): unknown {
    const value = resolveNestedPath(this.settings, key);
    return value === undefined ? this.getDefaultValue(key) : value;
  }

  public async set<T = unknown>(key: NestedSettingKey, value: T): Promise<void> {
    if (!this._initialized) {
      throw new Error('Settings service is not initialized');
    }
    if (!validateSettingValue(key, value)) {
      throw new Error(`Invalid setting value for ${key}`);
    }

    const generation = this.generation;
    const previous = this.updateQueue;
    const update = previous.then(
      () => this.commitSetting(key, value, generation),
      () => this.commitSetting(key, value, generation)
    );
    this.updateQueue = update.catch(() => undefined);
    await update;
  }

  private async commitSetting<T>(
    key: NestedSettingKey,
    value: T,
    generation: number
  ): Promise<void> {
    if (generation !== this.generation || !this._initialized) {
      return;
    }
    const oldValue = this.get(key);

    // An identical choice during an unavailable read is still explicit intent.
    if (oldValue === value && this.baselineAvailable) {
      return;
    }

    const nextSettings = globalThis.structuredClone(this.settings);
    if (!this.assignNestedPath(nextSettings, key, value)) {
      throw new Error(`Failed to assign setting value for ${key}`);
    }

    const changed = new Map<string, unknown>();
    for (const leaf of SETTINGS_LEAF_KEYS) {
      if (leaf !== key && !leaf.startsWith(`${key}.`)) {
        continue;
      }
      const current = resolveNestedPath(this.settings, leaf);
      const next =
        resolveNestedPath(nextSettings, leaf) ?? resolveNestedPath(DEFAULT_SETTINGS, leaf);
      if (!validateSettingValue(leaf, next)) {
        throw new Error(`Invalid setting value for ${leaf}`);
      }
      if (!Object.is(current, next) || (!this.baselineAvailable && leaf === key)) {
        changed.set(leaf, next);
        this.assignNestedPath(nextSettings, leaf, next);
      }
    }
    if (changed.size === 0) {
      return;
    }
    for (const [leaf, next] of changed) {
      this.pendingChanges.set(leaf, next);
    }

    const timestamp = Date.now();
    nextSettings.lastModified = timestamp;
    let saved = false;
    let failure: unknown;
    let savedSettings = nextSettings;
    try {
      if (this.repository.saveChanges) {
        savedSettings = await this.repository.saveChanges(this.pendingChanges, timestamp);
      } else {
        await this.repository.save(nextSettings);
      }
      saved = true;
    } catch (error) {
      failure = error;
    }
    if (generation !== this.generation || !this._initialized) {
      if (saved) {
        this.pendingChanges.clear();
      }
      if (!saved) {
        throw failure;
      }
      return;
    }
    const previousSettings = this.settings;
    this.settings = saved ? savedSettings : nextSettings;
    if (saved) {
      this.pendingChanges.clear();
      this.baselineAvailable = true;
    }
    this.setUnsaved(!saved);
    this.notifyListeners({
      key,
      oldValue,
      newValue: value,
      timestamp,
      status: saved ? 'success' : 'error',
    });
    if (saved) {
      this.notifyRecoveredSettings(previousSettings, changed);
    }
    if (!saved) {
      throw failure;
    }
  }

  public hasUnsavedChanges(): boolean {
    return this.unsaved;
  }

  public subscribePersistence(listener: (unsaved: boolean) => void): () => void {
    this.persistenceListeners.add(listener);
    return () => this.persistenceListeners.delete(listener);
  }

  /** Retry only explicit pending edits after queued writes have settled. */
  public async retryUnsaved(): Promise<void> {
    if (!this._initialized) {
      return;
    }
    const generation = this.generation;
    const previous = this.updateQueue;
    const retry = previous
      .catch(() => undefined)
      .then(async () => {
        if (!this.unsaved || generation !== this.generation || !this._initialized) {
          return;
        }
        if (this.repository.saveChanges) {
          if (this.pendingChanges.size > 0) {
            const saved = await this.repository.saveChanges(this.pendingChanges, Date.now());
            this.pendingChanges.clear();
            if (generation === this.generation && this._initialized) {
              const previousSettings = this.settings;
              this.settings = saved;
              this.notifyRecoveredSettings(previousSettings);
            }
          } else if (this.repository.loadState) {
            const result = await this.repository.loadState();
            if (!result.available) {
              throw new Error(
                'Settings storage is unreadable or has an unsupported schema; retry after recovery'
              );
            }
            if (generation === this.generation && this._initialized) {
              const previousSettings = this.settings;
              this.settings = result.settings;
              this.notifyRecoveredSettings(previousSettings);
            }
          }
        } else {
          await this.repository.save(globalThis.structuredClone(this.settings));
        }
        if (generation === this.generation && this._initialized) {
          this.baselineAvailable = true;
          this.setUnsaved(false);
        }
      });
    this.updateQueue = retry.catch(() => undefined);
    await retry;
  }

  private setUnsaved(value: boolean): void {
    if (this.unsaved === value) {
      return;
    }
    this.unsaved = value;
    for (const listener of this.persistenceListeners) {
      try {
        listener(value);
      } catch (error) {
        __DEV__ && logger.error('Settings persistence listener error:', error);
      }
    }
  }

  public subscribe(listener: (event: SettingChangeEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private getDefaultValue(key: string): unknown {
    return resolveNestedPath(DEFAULT_SETTINGS, key);
  }

  private notifyRecoveredSettings(
    previous: AppSettings,
    explicitlyChanged: ReadonlyMap<string, unknown> = new Map()
  ): void {
    for (const key of SETTINGS_LEAF_KEYS) {
      if (explicitlyChanged.has(key)) {
        continue;
      }
      const oldValue = resolveNestedPath(previous, key);
      const newValue = resolveNestedPath(this.settings, key);
      if (!Object.is(oldValue, newValue)) {
        this.notifyListeners({
          key,
          oldValue,
          newValue,
          timestamp: Date.now(),
          status: 'success',
        });
      }
    }
  }

  /** Assign value to nested object property by dot-notation path */
  private assignNestedPath(target: unknown, path: string, value: unknown): boolean {
    if (target === null || typeof target !== 'object') {
      return false;
    }
    if (typeof path !== 'string' || path === '') {
      return false;
    }

    const segments = path.split('.');
    const last = segments[segments.length - 1];
    if (!last) {
      return false;
    }

    let current = target as Record<string, unknown>;

    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i];
      if (!segment) {
        return false;
      }
      const existing = Object.hasOwn(current, segment) ? current[segment] : undefined;
      if (existing === null || typeof existing !== 'object') {
        const next = Object.create(null) as Record<string, unknown>;
        current[segment] = next;
        current = next;
        continue;
      }
      current = existing as Record<string, unknown>;
    }

    current[last] = value;
    return true;
  }

  /** Notify subscribers independently so one listener failure does not block the rest. */
  private notifyListeners(event: SettingChangeEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        __DEV__ && logger.error('Settings listener error:', error);
      }
    }
  }
}

const { getInstance: getSettingsService, resetForTests: resetSettingsServiceForTests } =
  createSingleton(() => new SettingsService());

export { getSettingsService, resetSettingsServiceForTests };
