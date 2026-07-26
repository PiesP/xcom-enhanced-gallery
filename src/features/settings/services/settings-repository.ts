// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { APP_SETTINGS_STORAGE_KEY, createDefaultSettings } from '@constants/settings';
import { logger } from '@shared/logging/logger';
import { getPersistentStorage } from '@shared/services/persistent-storage';
import type { AppSettings } from '@shared/types/settings.types';
import { isRecord } from '@shared/utils/types/guards';
import { migrateSettings } from './settings-migration';
import { normalizeStoredSettings } from './settings-validation';

/** Schema version hash - bump when persisted settings shape changes */
const SETTINGS_SCHEMA_HASH = '1';

interface StoredSettings {
  /** @internal Schema version hash for migration detection */
  __schemaHash?: string;
  [key: string]: unknown;
}

export interface SettingsRepository {
  load(): Promise<AppSettings>;
  save(settings: AppSettings): Promise<void>;
}

export class PersistentSettingsRepository implements SettingsRepository {
  private readonly storage = getPersistentStorage();
  private readonly schemaHash = SETTINGS_SCHEMA_HASH;

  public async load(): Promise<AppSettings> {
    // Retrieve as unknown first — never cast storage values blindly
    const raw: unknown = await this.storage.get(APP_SETTINGS_STORAGE_KEY);
    if (!isRecord(raw)) {
      return globalThis.structuredClone(createDefaultSettings(Date.now()));
    }

    const stored = raw as unknown as StoredSettings;
    const nowMs = Date.now();
    const migrated = migrateSettings(stored, nowMs);
    const normalized = normalizeStoredSettings(migrated, nowMs);
    if (stored.__schemaHash !== this.schemaHash) {
      await this.persist(normalized).catch(() => {
        __DEV__ && logger.warn('[SettingsRepository] Failed to persist migrated settings');
      });
    }
    return globalThis.structuredClone(normalized);
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
