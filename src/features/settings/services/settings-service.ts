// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

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
import { resolveNestedPath } from '@shared/utils/object/path';

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
    if (!this.isValidSettingValue(this.getDefaultValue(key), value)) {
      throw new Error(`Invalid setting value for ${key}`);
    }

    const oldValue = this.get(key);

    if (!this.assignNestedPath(this.settings, key, value)) {
      throw new Error(`Failed to assign setting value for ${key}`);
    }

    this.notifyListeners({
      key,
      oldValue,
      newValue: value,
      timestamp: Date.now(),
      status: 'success',
    });
    await this.persist();
    this.settings.lastModified = Date.now();
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
  private isValidSettingValue(defaultValue: unknown, value: unknown): boolean {
    if (defaultValue === undefined) return true;
    if (Array.isArray(defaultValue)) return Array.isArray(value);
    if (typeof defaultValue === 'object' && defaultValue !== null) {
      return typeof value === 'object' && value !== null;
    }
    return typeof value === typeof defaultValue;
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
