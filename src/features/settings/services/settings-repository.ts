// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { APP_SETTINGS_STORAGE_KEY, createDefaultSettings } from '@constants/settings';
import { logger } from '@shared/logging/logger';
import { getPersistentStorage } from '@shared/services/persistent-storage';
import type { AppSettings } from '@shared/types/settings.types';
import { isRecord } from '@shared/utils/types/guards';
import { migrateSettings } from './settings-migration';
import {
  normalizeStoredSettings,
  SETTINGS_LEAF_KEYS,
  validateSettingValue,
} from './settings-validation';

/** Schema version hash - bump when persisted settings shape changes */
const SETTINGS_SCHEMA_HASH = '1';
// Older builds read only the legacy record and will not display these newer edits.
// Keep both forms for compatibility; a downgrade needs an explicit data migration.
const FIELD_PREFIX = `${APP_SETTINGS_STORAGE_KEY}:field:`;

interface StoredSettings {
  /** @internal Schema version hash for migration detection */
  __schemaHash?: string;
  [key: string]: unknown;
}

function settingsMatch(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) {
    return true;
  }
  if (!isRecord(left) || !isRecord(right)) {
    return false;
  }

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every((key) => Object.hasOwn(right, key) && settingsMatch(left[key], right[key]));
}

export interface SettingsRepository {
  load(): Promise<AppSettings>;
  /** Legacy full-save interface for injected repositories; production uses saveChanges. */
  save(settings: AppSettings): Promise<void>;
  loadState?(): Promise<{ settings: AppSettings; available: boolean }>;
  saveChanges?(changes: ReadonlyMap<string, unknown>, timestamp: number): Promise<AppSettings>;
}

export class PersistentSettingsRepository implements SettingsRepository {
  private readonly storage = getPersistentStorage();
  private readonly schemaHash = SETTINGS_SCHEMA_HASH;

  public async load(): Promise<AppSettings> {
    return (await this.loadState()).settings;
  }

  public async loadState(): Promise<{ settings: AppSettings; available: boolean }> {
    // Retrieve as unknown first — never cast storage values blindly
    const [base, ...fields] = await Promise.all([
      this.storage.getState<unknown>(APP_SETTINGS_STORAGE_KEY),
      ...SETTINGS_LEAF_KEYS.map((key) => this.storage.getState<unknown>(FIELD_PREFIX + key)),
    ]);
    const raw = base.value;
    const nowMs = Date.now();
    let normalized = createDefaultSettings(nowMs);
    if (isRecord(raw)) {
      const stored = raw as unknown as StoredSettings;
      const migrated = migrateSettings(stored, nowMs);
      normalized = normalizeStoredSettings(migrated, nowMs);
      const normalizationChanged = !settingsMatch(migrated, normalized);
      if (base.available && (stored.__schemaHash !== this.schemaHash || normalizationChanged)) {
        await this.persist(normalized).catch(() => {
          __DEV__ && logger.warn('[SettingsRepository] Failed to persist normalized settings');
        });
      }
    }
    for (const [index, key] of SETTINGS_LEAF_KEYS.entries()) {
      const field = fields[index];
      if (!field || !validateSettingValue(key, field.value)) {
        continue;
      }
      const [group, name] = key.split('.') as [keyof AppSettings, string];
      (normalized[group] as Record<string, unknown>)[name] = field.value;
    }
    return {
      settings: globalThis.structuredClone(normalized),
      available: base.available && fields.every((field) => field?.available),
    };
  }

  /** A stale full snapshot has no safe interpretation as a user edit. */
  public async save(_settings: AppSettings): Promise<void> {
    throw new Error('Full settings snapshot writes are unsupported; save explicit field changes');
  }

  public async saveChanges(
    changes: ReadonlyMap<string, unknown>,
    timestamp: number
  ): Promise<AppSettings> {
    const current = await this.loadState();
    if (!current.available) {
      throw new Error('Settings storage is unreadable; explicit changes remain unsaved');
    }
    for (const [key, value] of changes) {
      if (!SETTINGS_LEAF_KEYS.some((leaf) => leaf === key) || !validateSettingValue(key, value)) {
        throw new Error(`Invalid setting value for ${key}`);
      }
      await this.storage.set(FIELD_PREFIX + key, value);
      const confirmed = await this.storage.getState<unknown>(FIELD_PREFIX + key);
      if (!confirmed.available || !Object.is(confirmed.value, value)) {
        throw new Error(`Settings field write could not be confirmed: ${key}`);
      }
      const [group, name] = key.split('.') as [keyof AppSettings, string];
      (current.settings[group] as Record<string, unknown>)[name] = value;
    }
    current.settings.lastModified = timestamp;
    return current.settings;
  }

  private async persist(settings: AppSettings): Promise<void> {
    await this.storage.set(APP_SETTINGS_STORAGE_KEY, {
      ...settings,
      __schemaHash: this.schemaHash,
    });
  }
}
