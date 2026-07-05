// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { APP_SETTINGS_STORAGE_KEY, createDefaultSettings } from '@constants/settings';
import { logger } from '@shared/logging/logger';
import { PersistentStorage } from '@shared/services/persistent-storage';
import type { AppSettings } from '@shared/types/settings.types';
import { migrateSettings } from './settings-migration';

/** Schema version hash - bump when persisted settings shape changes */
const SETTINGS_SCHEMA_HASH = '1';

interface StoredSettings extends AppSettings {
  /** @internal Schema version hash for migration detection */
  __schemaHash?: string;
}

export interface SettingsRepository {
  load(): Promise<AppSettings>;
  save(settings: AppSettings): Promise<void>;
}

export class PersistentSettingsRepository implements SettingsRepository {
  private readonly storage = PersistentStorage.getInstance();
  private readonly schemaHash = SETTINGS_SCHEMA_HASH;

  public async load(): Promise<AppSettings> {
    const stored = await this.storage.get<StoredSettings>(APP_SETTINGS_STORAGE_KEY);
    if (!stored) {
      return globalThis.structuredClone(createDefaultSettings(Date.now()));
    }

    const nowMs = Date.now();
    const migrated = migrateSettings(stored, nowMs);
    if (stored.__schemaHash !== this.schemaHash) {
      await this.persist(migrated).catch(() => {
        __DEV__ && logger.warn('[SettingsRepository] Failed to persist migrated settings');
      });
    }
    return globalThis.structuredClone(migrated);
  }

  public async save(settings: AppSettings): Promise<void> {
    await this.persist(settings);
  }

  private async persist(settings: AppSettings): Promise<void> {
    await this.storage.set(APP_SETTINGS_STORAGE_KEY, {
      ...settings,
      __schemaHash: this.schemaHash,
    });
  }
}
