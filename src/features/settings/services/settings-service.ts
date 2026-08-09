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
import { validateSettingValue } from './settings-validation';

export class SettingsService {
  private _initialized = false;

  private settings: AppSettings = createDefaultSettings(Date.now());
  private readonly listeners = new Set<(event: SettingChangeEvent) => void>();
  private updateQueue: Promise<void> = Promise.resolve();

  constructor(
    private readonly repository: SettingsRepository = new PersistentSettingsRepository()
  ) {}

  public async initialize(): Promise<void> {
    if (this._initialized) return;
    this.settings = await this.repository.load();
    this._initialized = true;
  }

  public destroy(): void {
    this.listeners.clear();
    this._initialized = false;
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
    if (!validateSettingValue(key, value)) {
      throw new Error(`Invalid setting value for ${key}`);
    }

    const previous = this.updateQueue;
    const update = previous.then(
      () => this.commitSetting(key, value),
      () => this.commitSetting(key, value)
    );
    this.updateQueue = update.catch(() => undefined);
    await update;
  }

  private async commitSetting<T>(key: NestedSettingKey, value: T): Promise<void> {
    const oldValue = this.get(key);

    // Skip if value is unchanged (idempotent — avoid unnecessary saves)
    if (oldValue === value) return;

    const nextSettings = globalThis.structuredClone(this.settings);
    if (!this.assignNestedPath(nextSettings, key, value)) {
      throw new Error(`Failed to assign setting value for ${key}`);
    }

    const timestamp = Date.now();
    nextSettings.lastModified = timestamp;
    await this.repository.save(nextSettings);

    this.settings = nextSettings;
    this.notifyListeners({
      key,
      oldValue,
      newValue: value,
      timestamp,
      status: 'success',
    });
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

  /** Assign value to nested object property by dot-notation path */
  private assignNestedPath(target: unknown, path: string, value: unknown): boolean {
    if (target === null || typeof target !== 'object') return false;
    if (typeof path !== 'string' || path === '') return false;

    const segments = path.split('.');
    const last = segments[segments.length - 1];
    if (!last) return false;

    let current = target as Record<string, unknown>;

    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i];
      if (!segment) return false;
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

  /** Validate a setting value against its default type */

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
