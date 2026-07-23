// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { getStorageAdapter } from '@platform/index';
import { createLogger } from '@shared/logging/logger';

const log = createLogger('PersistentStorage');

/**
 * localStorage fallback prefix — used when the primary storage adapter
 * (GM_setValue / chrome.storage.local) fails, providing a last-resort
 * persistence layer that works across reloads.
 */
const LS_FALLBACK_PREFIX = 'xeg-fallback:';
const STORAGE_ENVELOPE_VERSION = 1;

interface StoredValueEnvelope {
  readonly __xegStorageEnvelope: typeof STORAGE_ENVELOPE_VERSION;
  readonly updatedAt: number;
  readonly value: unknown;
}

interface DecodedStoredValue {
  readonly value: unknown;
  readonly updatedAt: number | undefined;
}

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function encodeValue(value: unknown): string {
  const envelope: StoredValueEnvelope = {
    __xegStorageEnvelope: STORAGE_ENVELOPE_VERSION,
    updatedAt: Date.now(),
    value,
  };
  return JSON.stringify(envelope);
}

function decodeValue(raw: unknown): DecodedStoredValue | null {
  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
  }

  if (
    isRecord(parsed) &&
    parsed.__xegStorageEnvelope === STORAGE_ENVELOPE_VERSION &&
    typeof parsed.updatedAt === 'number' &&
    Object.hasOwn(parsed, 'value')
  ) {
    return { value: parsed.value, updatedAt: parsed.updatedAt };
  }

  // Accept values written before the envelope was introduced.
  return { value: parsed, updatedAt: undefined };
}

export class PersistentStorage {
  private get adapter() {
    return getStorageAdapter();
  }

  async set(key: string, value: unknown): Promise<void> {
    if (value === undefined) {
      await this.remove(key);
      return;
    }

    const serialized = encodeValue(value);
    try {
      await this.adapter.set(key, serialized);
      // Primary write succeeded — clean up any stale fallback entry
      lsRemove(key);
    } catch (error) {
      // Fallback to localStorage when primary storage fails
      lsWriteRaw(key, serialized);
      __DEV__ && log.warn('storage.fallback', { error: String(error) });
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

    const primary = value === undefined || value === null ? null : decodeValue(value);
    const fallback = this.readFallbackValue(key);

    if (!primary) {
      return (fallback?.value as T | undefined) ?? defaultValue;
    }

    // A primary write can fail while the adapter still returns its previous
    // value on the next load. Prefer the newer fallback record in that case.
    if (
      fallback &&
      fallback.updatedAt !== undefined &&
      (primary.updatedAt === undefined || fallback.updatedAt > primary.updatedAt)
    ) {
      return fallback.value as T;
    }

    return primary.value as T;
  }

  private readFallbackOrDefault<T>(key: string, defaultValue?: T): T | undefined {
    return (this.readFallbackValue(key)?.value as T | undefined) ?? defaultValue;
  }

  private readFallbackValue(key: string): DecodedStoredValue | null {
    const raw = lsReadRaw(key);
    return raw === null ? null : decodeValue(raw);
  }

  async getString(key: string, defaultValue?: string): Promise<string | undefined> {
    const value = await this.get<unknown>(key);
    if (value === undefined || value === null) return defaultValue;
    // L11: MV3 adapter may store raw objects; cast through String() for safety
    if (typeof value === 'string') return value;
    // If value is an object (MV3 stores raw), try toString to preserve compatibility
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
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
      return (decodeValue(value)?.value as T | undefined) ?? defaultValue;
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

let storageInstance: PersistentStorage | null = null;

export function getPersistentStorage(): PersistentStorage {
  if (!storageInstance) {
    storageInstance = new PersistentStorage();
  }
  return storageInstance;
}

/** Reset singleton instance (for testing only) */
export function resetPersistentStorageForTests(): void {
  storageInstance = null;
}
