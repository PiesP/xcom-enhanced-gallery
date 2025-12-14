import { getUserscript } from '@shared/external/userscript';
import { logger } from '@shared/logging';
import { createSingleton } from '@shared/utils/types/singleton';

export class PersistentStorage {
  private readonly userscript = getUserscript();
  private static readonly singleton = createSingleton(() => new PersistentStorage());

  private constructor() {}

  static getInstance(): PersistentStorage {
    return PersistentStorage.singleton.get();
  }

  /** @internal Test helper */
  static resetForTests(): void {
    PersistentStorage.singleton.reset();
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      await this.userscript.setValue(key, serialized);
    } catch (error) {
      logger.error(`PersistentStorage.set failed for "${key}":`, error);
      throw error;
    }
  }

  async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    try {
      const value = await this.userscript.getValue<string | undefined>(key);
      if (value === undefined || value === null) return defaultValue;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : typeof error === 'string' ? error : '';

      // Expected in environments where GM_* APIs are missing/limited.
      // Keep this branch resilient to wording differences ("unavailable" vs "not available").
      if (/GM_getValue/i.test(message) && /(unavailable|not available)/i.test(message)) {
        return defaultValue;
      }
      logger.error(`PersistentStorage.get failed for "${key}":`, error);
      return defaultValue;
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const value = await this.userscript.getValue<unknown>(key);
      return value !== undefined && value !== null;
    } catch {
      return false;
    }
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
      if (value === undefined || value === null) return defaultValue;

      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch {
      return defaultValue;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await this.userscript.deleteValue(key);
    } catch (error) {
      logger.error(`PersistentStorage.remove failed for "${key}":`, error);
      throw error;
    }
  }
}

export function getPersistentStorage(): PersistentStorage {
  return PersistentStorage.getInstance();
}
