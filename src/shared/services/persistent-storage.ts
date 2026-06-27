// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { getStorageAdapter } from '@platform/index';
import { SingletonBase } from '@shared/services/singleton-base';

let _persistentStorageInstance: PersistentStorage | null = null;

export class PersistentStorage {
  private get adapter() {
    return getStorageAdapter();
  }

  private constructor() {}

  static getInstance(): PersistentStorage {
    return SingletonBase.get(
      () => _persistentStorageInstance,
      (inst) => {
        _persistentStorageInstance = inst;
      },
      () => new PersistentStorage()
    );
  }

  /** @internal Test helper */
  static resetForTests(): void {
    SingletonBase.reset(
      () => _persistentStorageInstance,
      (inst) => {
        _persistentStorageInstance = inst;
      }
    );
  }

  /** Destroy service */
  destroy(): void {
    _persistentStorageInstance = null;
  }

  async set(key: string, value: unknown): Promise<void> {
    if (value === undefined) {
      await this.adapter.remove(key);
      return;
    }

    const serialized = JSON.stringify(value);
    await this.adapter.set(key, serialized);
  }

  async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const value = await this.adapter.get<unknown>(key);
    if (value === undefined || value === null) return defaultValue;

    // MV3 stores raw objects; GM stores JSON strings via PersistentStorage.set().
    // If value is already a non-string (object/array), return it directly.
    if (typeof value !== 'string') {
      return value as T;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  }

  async getString(key: string, defaultValue?: string): Promise<string | undefined> {
    const value = await this.adapter.get<string | undefined>(key);
    if (value === undefined || value === null) return defaultValue;
    return value;
  }

  async has(key: string): Promise<boolean> {
    const value = await this.adapter.get<unknown>(key);
    return value !== undefined && value !== null;
  }

  /**
   * Synchronous storage access via UserscriptAPI adapter.
   *
   * [WARNING] Only reliable in Tampermonkey and Violentmonkey.
   * MV3 extensions do NOT support this — returns defaultValue.
   * Use ONLY for critical initialization paths (e.g., theme to prevent FOUC).
   */
  getSync<T>(key: string, defaultValue?: T): T | undefined {
    if (!this.adapter.getSync) return defaultValue;
    try {
      const value = this.adapter.getSync<string>(key);
      if (value == null) return defaultValue;
      try {
        return JSON.parse(value) as T;
      } catch {
        return defaultValue;
      }
    } catch {
      return defaultValue;
    }
  }

  async remove(key: string): Promise<void> {
    await this.adapter.remove(key);
  }
}
