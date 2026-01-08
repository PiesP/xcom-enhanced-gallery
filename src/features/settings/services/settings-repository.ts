import { createDefaultSettings } from '@constants/default-settings';
import { APP_SETTINGS_STORAGE_KEY } from '@constants/storage';
import type { AppSettings } from '@features/settings/types/settings.types';
import { logger } from '@shared/logging/logger';
import { getPersistentStorage } from '@shared/services/persistent-storage';
import { migrateSettings } from './settings-migration';
import { computeCurrentSettingsSchemaHash } from './settings-schema';

/**
 * Internal stored settings with schema hash metadata
 * @internal
 */
interface StoredSettings extends AppSettings {
  /**
   * Schema version hash for migration detection
   * @internal
   */
  __schemaHash?: string;
}

/**
 * Repository contract for persistent settings storage
 *
 * Provides load/save operations with automatic schema migration and fallback handling.
 * All operations return structurally cloned data to prevent unintended mutations.
 */
export interface SettingsRepository {
  /**
   * Load settings from persistent storage
   *
   * Performs automatic migration if schema hash differs.
   * Returns default settings if storage is empty or corrupted.
   *
   * @returns Deep-cloned settings object
   * @throws Never throws - errors are logged and fallback to defaults
   */
  load(): Promise<AppSettings>;

  /**
   * Save settings to persistent storage
   *
   * Persists settings with current schema hash for future migration detection.
   *
   * @param settings - Settings object to persist
   * @throws {Error} If storage operation fails
   */
  save(settings: AppSettings): Promise<void>;
}

/**
 * Persistent storage implementation for application settings
 *
 * Responsibilities:
 * - Load settings from GM_getValue/localStorage storage
 * - Save settings with schema hash metadata
 * - Automatic schema migration on hash mismatch
 * - Graceful fallback to defaults on errors
 * - Deep-clone all returned data for immutability
 *
 * @example
 * ```typescript
 * const repo = new PersistentSettingsRepository();
 * const settings = await repo.load();
 * settings.gallery.layout = 'horizontal';
 * await repo.save(settings);
 * ```
 */
export class PersistentSettingsRepository implements SettingsRepository {
  private readonly storage = getPersistentStorage();
  private readonly schemaHash = computeCurrentSettingsSchemaHash();

  public async load(): Promise<AppSettings> {
    try {
      const stored = await this.storage.getJson<StoredSettings>(APP_SETTINGS_STORAGE_KEY);
      if (!stored) {
        const defaults = createDefaultSettings();
        await this.persist(defaults).catch(() => {
          __DEV__ && logger.warn('[SettingsRepository] Failed to persist defaults');
        });
        return globalThis.structuredClone(defaults);
      }

      const nowMs = Date.now();
      const migrated = migrateSettings(stored, nowMs);
      if (stored.__schemaHash !== this.schemaHash) {
        await this.persist(migrated).catch(() => {
          __DEV__ && logger.warn('[SettingsRepository] Failed to persist migrated settings');
        });
      }
      return globalThis.structuredClone(migrated);
    } catch (error) {
      __DEV__ && logger.warn('[SettingsRepository] Load failed, falling back to defaults', error);
      const defaults = createDefaultSettings();
      await this.persist(defaults).catch(() => {
        __DEV__ && logger.warn('[SettingsRepository] Failed to persist defaults');
      });
      return globalThis.structuredClone(defaults);
    }
  }

  public async save(settings: AppSettings): Promise<void> {
    try {
      await this.persist(settings);
    } catch (error) {
      logger.error('[SettingsRepository] Save operation failed', error);
      throw error;
    }
  }

  private async persist(settings: AppSettings): Promise<void> {
    await this.storage.setJson(APP_SETTINGS_STORAGE_KEY, {
      ...settings,
      __schemaHash: this.schemaHash,
    });
  }
}
