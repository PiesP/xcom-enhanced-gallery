import { getUserscript, type UserscriptAPI } from '@shared/external/userscript/adapter';

export interface PersistentStorageGetOptions {
  readonly warnOnParseErrorOnce?: boolean;
  readonly selfHealOnParseError?: boolean;
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
    _persistentStorageInstance = null;
  }

  async set(key: string, value: unknown): Promise<void> {
    if (value === undefined) {
      await this.userscript.deleteValue(key);
      return;
    }

    const serialized = typeof value === 'string' ? value : JSON.stringify(value);

    if (serialized === undefined) {
      await this.userscript.deleteValue(key);
      return;
    }

    await this.userscript.setValue(key, serialized);
  }

  async get<T>(
    key: string,
    defaultValue?: T,
    options: PersistentStorageGetOptions = {}
  ): Promise<T | undefined> {
    const value = await this.userscript.getValue<string | undefined>(key);
    if (value === undefined || value === null) return defaultValue;

    try {
      return JSON.parse(value) as T;
    } catch {
      if (options.selfHealOnParseError === true) {
        try {
          await this.userscript.deleteValue(key);
        } catch {
          // Best-effort: do not throw from get().
        }
      }

      return defaultValue;
    }
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
      if (value === undefined || value === null) return defaultValue;

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

export function getPersistentStorage(): PersistentStorage {
  return PersistentStorage.getInstance();
}
