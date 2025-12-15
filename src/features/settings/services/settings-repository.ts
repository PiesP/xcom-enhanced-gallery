import { APP_SETTINGS_STORAGE_KEY, createDefaultSettings } from '@constants';
import type { AppSettings } from '@features/settings/types/settings.types';
import { logger } from '@shared/logging';
import { getPersistentStorage } from '@shared/services/persistent-storage';
import { cloneDeep } from '@shared/utils/types/safety';
import { migrateSettings } from './settings-migration';
import { computeCurrentSettingsSchemaHash } from './settings-schema';

interface StoredSettings extends AppSettings {
  __schemaHash?: string;
}

export interface SettingsRepository {
  load(): Promise<AppSettings>;
  save(settings: AppSettings): Promise<void>;
}

export class PersistentSettingsRepository implements SettingsRepository {
  private readonly storage = getPersistentStorage();
  private readonly schemaHash = computeCurrentSettingsSchemaHash();

  public async load(): Promise<AppSettings> {
    try {
      const stored = await this.storage.get<StoredSettings>(APP_SETTINGS_STORAGE_KEY);
      if (!stored) {
        const defaults = createDefaultSettings();
        await this.persist(defaults);
        return cloneDeep(defaults);
      }

      const nowMs = Date.now();
      const migrated = migrateSettings(stored, nowMs);
      if (stored.__schemaHash !== this.schemaHash) {
        await this.persist(migrated);
      }
      return cloneDeep(migrated);
    } catch (error) {
      logger.warn('[SettingsRepository] load failed, falling back to defaults', error);
      const defaults = createDefaultSettings();
      await this.persist(defaults);
      return cloneDeep(defaults);
    }
  }

  public async save(settings: AppSettings): Promise<void> {
    try {
      await this.persist(settings);
    } catch (error) {
      logger.error('[SettingsRepository] save failed', error);
      throw error;
    }
  }

  private async persist(settings: AppSettings): Promise<void> {
    await this.storage.set(APP_SETTINGS_STORAGE_KEY, {
      ...settings,
      __schemaHash: this.schemaHash,
    });
  }
}
