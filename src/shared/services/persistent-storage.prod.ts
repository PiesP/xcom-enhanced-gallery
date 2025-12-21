import { getUserscriptSafe, type UserscriptAPI } from '@shared/external/userscript';
import { createSingleton } from '@shared/utils/types/singleton';

export class PersistentStorage {
  private get userscript(): UserscriptAPI {
    return getUserscriptSafe();
  }

  private static readonly singleton = createSingleton(() => new PersistentStorage());

  private constructor() {}

  static getInstance(): PersistentStorage {
    return PersistentStorage.singleton.get();
  }

  private parseMaybeJsonString(rawValue: string): string | undefined {
    try {
      const parsed = JSON.parse(rawValue) as unknown;
      return typeof parsed === 'string' ? parsed : undefined;
    } catch {
      return undefined;
    }
  }

  private serializeValueForStorage(value: unknown): string | undefined {
    if (typeof value === 'string') {
      return value;
    }

    return JSON.stringify(value);
  }

  /**
   * Store a raw string value without JSON encoding.
   *
   * Use this with {@link getString} / {@link getStringSync}.
   */
  async setString(key: string, value: string | undefined): Promise<void> {
    return this.set(key, value);
  }

  /**
   * Store a JSON-encoded value.
   *
   * Use this with {@link getJson} / {@link getJsonSync}.
   */
  async setJson<T>(key: string, value: T | undefined): Promise<void> {
    // Guard: JSON.stringify(undefined) returns undefined, which can break storage adapters.
    // Treat undefined (and other non-serializable payloads) as an explicit delete.
    if (value === undefined) {
      await this.userscript.deleteValue(key);
      return;
    }

    const serialized = JSON.stringify(value);

    if (serialized === undefined) {
      await this.userscript.deleteValue(key);
      return;
    }

    await this.userscript.setValue(key, serialized);
  }

  async set<T>(key: string, value: T): Promise<void> {
    // Prefer explicit methods for clarity.
    // - setString(): stores raw strings
    // - setJson(): stores JSON-encoded values
    // Guard: JSON.stringify(undefined) returns undefined, which can break storage adapters.
    // Treat undefined (and other non-serializable payloads) as an explicit delete.
    if (value === undefined) {
      await this.userscript.deleteValue(key);
      return;
    }

    const serialized = this.serializeValueForStorage(value);

    if (serialized === undefined) {
      await this.userscript.deleteValue(key);
      return;
    }

    await this.userscript.setValue(key, serialized);
  }

  /**
   * Retrieve a string value without JSON parsing.
   *
   * This is the safe companion to get<T>() for keys that store raw strings.
   * If the stored value happens to be a JSON string (e.g. "\"dark\""), it will
   * be parsed and returned as a plain string for backward compatibility.
   */
  async getString(key: string, defaultValue?: string): Promise<string | undefined> {
    const value = await this.userscript.getValue<string | undefined>(key);
    if (value === undefined || value === null) return defaultValue;

    // Best-effort: allow values stored as JSON strings.
    const parsedString = this.parseMaybeJsonString(value);
    if (parsedString !== undefined) return parsedString;

    return value;
  }

  async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const value = await this.userscript.getValue<string | undefined>(key);
    if (value === undefined || value === null) return defaultValue;

    try {
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Retrieve a JSON-parsed value.
   *
   * This is an explicit alias for {@link get}.
   */
  async getJson<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    return this.get<T>(key, defaultValue);
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

  /**
   * Synchronous variant of getJson().
   *
   * This is an explicit alias for {@link getSync}.
   */
  getJsonSync<T>(key: string, defaultValue?: T): T | undefined {
    return this.getSync<T>(key, defaultValue);
  }

  /**
   * Synchronous variant of getString().
   *
   * Only reliable in Tampermonkey and Violentmonkey.
   */
  getStringSync(key: string, defaultValue?: string): string | undefined {
    try {
      const value = this.userscript.getValueSync<string>(key);
      if (value === undefined || value === null) return defaultValue;

      try {
        const parsedString = this.parseMaybeJsonString(value);
        if (parsedString !== undefined) return parsedString;
      } catch {
        // Ignore parse failures; return raw value.
      }

      return value;
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
