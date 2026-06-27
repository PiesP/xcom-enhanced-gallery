// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * MV3 extension storage adapter.
 *
 * Uses chrome.storage.local for persistent storage.
 * All methods are async — no synchronous getSync() support.
 */

import type { StorageAdapter } from './types';

export class MV3StorageAdapter implements StorageAdapter {
  async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const result = await chrome.storage.local.get(key);
    const value = result[key];
    if (value === undefined || value === null) return defaultValue;
    return value as T;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  }

  async remove(key: string): Promise<void> {
    await chrome.storage.local.remove(key);
  }

  async listKeys(): Promise<string[]> {
    const result = await chrome.storage.local.get(null);
    return Object.keys(result);
  }
}
