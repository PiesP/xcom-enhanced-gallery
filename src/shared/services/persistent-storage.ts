// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { UserscriptAPI } from '@shared/external/userscript/adapter';
import { getUserscript } from '@shared/external/userscript/adapter';

// Simple XOR-based obfuscation for sensitive storage values.
// Not cryptographically secure — intended to prevent casual inspection of stored data.
const OBFUSCATION_KEY = 'xeg-storage-key';

function obfuscate(value: string): string {
  const encoded = Array.from(value).map((char, i) =>
    String.fromCharCode(char.charCodeAt(0) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length))
  );
  return `obf:${btoa(encoded.join(''))}`;
}

function deobfuscate(value: string): string {
  if (!value.startsWith('obf:')) return value;
  try {
    const decoded = atob(value.slice(4));
    return Array.from(decoded)
      .map((char, i) =>
        String.fromCharCode(
          char.charCodeAt(0) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length)
        )
      )
      .join('');
  } catch {
    return value;
  }
}

let _persistentStorageInstance: PersistentStorage | null = null;

export class PersistentStorage {
  private get userscript(): UserscriptAPI {
    return getUserscript();
  }

  private constructor() {}

  static getInstance(): PersistentStorage {
    if (!_persistentStorageInstance) _persistentStorageInstance = new PersistentStorage();
    return _persistentStorageInstance;
  }

  /** @internal Test helper */
  static resetForTests(): void {
    _persistentStorageInstance?.destroy();
    _persistentStorageInstance = null;
  }

  /** Destroy service */
  destroy(): void {
    _persistentStorageInstance = null;
  }

  async set(key: string, value: unknown): Promise<void> {
    if (value === undefined) {
      await this.userscript.deleteValue(key);
      return;
    }

    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    // Obfuscate sensitive keys to avoid plaintext storage of critical values.
    const isSensitive = this.isSensitiveKey(key);
    const storedValue = isSensitive ? obfuscate(serialized) : serialized;
    await this.userscript.setValue(key, storedValue);
  }

  async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const value = await this.userscript.getValue<string | undefined>(key);
    if (value === undefined || value === null) return defaultValue;

    try {
      const raw = this.isSensitiveKey(key) ? deobfuscate(value) : value;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  }

  /** Determine whether a storage key holds sensitive data that should be obfuscated. */
  private isSensitiveKey(key: string): boolean {
    return (
      key.includes('token') ||
      key.includes('auth') ||
      key.includes('secret') ||
      key.includes('password')
    );
  }

  async getString(key: string, defaultValue?: string): Promise<string | undefined> {
    const value = await this.userscript.getValue<string | undefined>(key);
    if (value === undefined || value === null) return defaultValue;
    return value;
  }

  async has(key: string): Promise<boolean> {
    const value = await this.userscript.getValue<unknown>(key);
    return value !== undefined && value !== null;
  }

  /**
   * Synchronous storage access via UserscriptAPI adapter.
   *
   * [WARNING] Only reliable in Tampermonkey and Violentmonkey.
   * Greasemonkey 4+ uses async-only storage - returns defaultValue.
   * Use ONLY for critical initialization paths (e.g., theme to prevent FOUC).
   */
  getSync<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const value = this.userscript.getValueSync<string>(key);
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
    await this.userscript.deleteValue(key);
  }
}
