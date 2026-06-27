// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * GM (userscript) storage adapter.
 *
 * Wraps GM_setValue/GM_getValue/GM_deleteValue/GM_listValues.
 * Provides synchronous getSync() — a userscript-only feature.
 */

import { getUserscript } from '@shared/external/userscript/adapter';
import type { GMNotificationDetails } from '@shared/types/core/userscript';
import type { StorageAdapter } from './types';

export class GMStorageAdapter implements StorageAdapter {
  private get gm() {
    return getUserscript();
  }

  async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    return this.gm.getValue<T>(key, defaultValue);
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.gm.setValue(key, value);
  }

  async remove(key: string): Promise<void> {
    await this.gm.deleteValue(key);
  }

  async listKeys(): Promise<string[]> {
    return this.gm.listValues();
  }

  getSync<T>(key: string, defaultValue?: T): T | undefined {
    return this.gm.getValueSync<T>(key, defaultValue);
  }
}

// Re-export for use in gallery-app.ts
export type { GMNotificationDetails };
