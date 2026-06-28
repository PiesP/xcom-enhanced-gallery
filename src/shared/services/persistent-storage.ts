// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { getStorageAdapter } from '@platform/index';
import { SingletonBase } from '@shared/services/singleton-base';

let _persistentStorageInstance: PersistentStorage | null = null;

/**
 * localStorage fallback prefix — used when the primary storage adapter
 * (GM_setValue / chrome.storage.local) fails, providing a last-resort
 * persistence layer that works across reloads.
 */
const LS_FALLBACK_PREFIX = 'xeg-fallback:';

function lsReadRaw(key: string): string | null {
  try {
    return localStorage.getItem(LS_FALLBACK_PREFIX + key);
  } catch {
    return null;
  }
}

function lsWriteRaw(key: string, value: string): void {
  try {
    localStorage.setItem(LS_FALLBACK_PREFIX + key, value);
  } catch {
    // localStorage may be unavailable (private browsing, quota exceeded)
  }
}

function lsRemove(key: string): void {
  try {
    localStorage.removeItem(LS_FALLBACK_PREFIX + key);
  } catch {
    // ignore
  }
}

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
      await this.remove(key);
      return;
    }

    const serialized = JSON.stringify(value);
    try {
      await this.adapter.set(key, serialized);
      // Clean up any stale fallback value from a previous failure
      lsRemove(key);
    } catch (error) {
      // Fallback to localStorage when primary storage fails
      lsWriteRaw(key, serialized);
      if (__DEV__)
        console.warn(
          '[PersistentStorage] Primary storage failed, using localStorage fallback:',
          error
        );
    }
  }

  async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    let value: unknown;
    try {
      value = await this.adapter.get<unknown>(key);
    } catch (_error) {
      // Adapter failed — try localStorage fallback from a previous failure
      return this.readFallbackOrDefault<T>(key, defaultValue);
    }
    if (value === undefined || value === null) {
      // Primary returned nothing — check localStorage fallback (written during
      // a previous adapter failure; acts as a persistent backup mirror)
      return this.readFallbackOrDefault<T>(key, defaultValue);
    }

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

  private readFallbackOrDefault<T>(key: string, defaultValue?: T): T | undefined {
    const raw = lsReadRaw(key);
    if (raw !== null) {
      try {
        return JSON.parse(raw) as T;
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
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
    try {
      await this.adapter.remove(key);
    } catch {
      // ignore — localStorage cleanup below
    }
    lsRemove(key);
  }
}
