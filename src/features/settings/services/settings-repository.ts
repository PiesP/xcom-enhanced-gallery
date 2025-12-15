import { APP_SETTINGS_STORAGE_KEY, createDefaultSettings } from '@constants';
import {
  planSettingsPersist,
  type SettingsPersistCommand,
} from '@features/settings/core/settings-persist';
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
    const cmds = planSettingsPersist({
      key: APP_SETTINGS_STORAGE_KEY,
      settings,
      schemaHash: this.schemaHash,
    });
    await this.executePersistCommands(cmds);
  }

  private async executePersistCommands(cmds: readonly SettingsPersistCommand[]): Promise<void> {
    for (const cmd of cmds) {
      switch (cmd.type) {
        case 'STORE_SET':
          await this.storage.set(cmd.key, cmd.value);
          break;
        case 'LOG':
          // Keep logging as a deliberate side effect.
          // eslint-disable-next-line default-case
          switch (cmd.level) {
            case 'debug':
              logger.debug(cmd.message, cmd.context);
              break;
            case 'info':
              logger.info(cmd.message, cmd.context);
              break;
            case 'warn':
              logger.warn(cmd.message, cmd.context);
              break;
            case 'error':
              logger.error(cmd.message, cmd.context);
              break;
          }
          break;
        default:
          break;
      }
    }
  }
}
