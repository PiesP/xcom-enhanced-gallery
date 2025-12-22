import { getUserscriptSafe, type UserscriptAPI } from '@shared/external/userscript';
import { logger } from '@shared/logging';
import { createSingleton } from '@shared/utils/types/singleton';

export interface PersistentStorageGetOptions {
  /**
   * When JSON parsing fails, log a warning only once per key to improve observability
   * without creating noisy logs.
   *
   * @default true
   */
  readonly warnOnParseErrorOnce?: boolean;

  /**
   * When JSON parsing fails, attempt to delete the key to self-heal corrupted values.
   * This is opt-in because some keys may intentionally store non-JSON strings.
   *
   * @default false
   */
  readonly selfHealOnParseError?: boolean;
}

export class PersistentStorage {
  private get userscript(): UserscriptAPI {
    return getUserscriptSafe();
  }

  private static readonly singleton = createSingleton(() => new PersistentStorage());

  private static readonly parseWarnedKeys = new Set<string>();
  private static readonly maxParseWarnedKeys = 1000;

  private constructor() {}

  static getInstance(): PersistentStorage {
    return PersistentStorage.singleton.get();
  }

  /** @internal Test helper */
  static resetForTests(): void {
    PersistentStorage.singleton.reset?.();
    PersistentStorage.parseWarnedKeys.clear();
  }

  private static maybeResetWarnedKeysOnOverflow(): void {
    if (PersistentStorage.parseWarnedKeys.size < PersistentStorage.maxParseWarnedKeys) {
      return;
    }

    // Defensive: avoid unbounded growth. We keep this intentionally simple.
    // When the cap is reached, we clear the set so the warning mechanism remains useful.
    PersistentStorage.parseWarnedKeys.clear();
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
    try {
      // Guard: JSON.stringify(undefined) returns undefined, which can break storage adapters.
      // Treat undefined (and other non-serializable payloads) as an explicit delete.
      if (value === undefined) {
        __DEV__ &&
          logger.warn(`PersistentStorage.setJson received undefined for "${key}", deleting key`);
        await this.userscript.deleteValue(key);
        return;
      }

      const serialized = JSON.stringify(value);

      if (serialized === undefined) {
        __DEV__ &&
          logger.warn(
            `PersistentStorage.setJson received a non-serializable value for "${key}", deleting key`
          );
        await this.userscript.deleteValue(key);
        return;
      }

      await this.userscript.setValue(key, serialized);
    } catch (error) {
      logger.error('Storage.setJson failed', key, error);
      throw error;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      // Prefer explicit methods for clarity.
      // - setString(): stores raw strings
      // - setJson(): stores JSON-encoded values
      // Guard: JSON.stringify(undefined) returns undefined, which can break storage adapters.
      // Treat undefined (and other non-serializable payloads) as an explicit delete.
      if (value === undefined) {
        __DEV__ &&
          logger.warn(`PersistentStorage.set received undefined for "${key}", deleting key`);
        await this.userscript.deleteValue(key);
        return;
      }

      const serialized = this.serializeValueForStorage(value);

      if (serialized === undefined) {
        __DEV__ &&
          logger.warn(
            `PersistentStorage.set received a non-serializable value for "${key}", deleting key`
          );
        await this.userscript.deleteValue(key);
        return;
      }

      await this.userscript.setValue(key, serialized);
    } catch (error) {
      logger.error('Storage.set failed', key, error);
      throw error;
    }
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

  private warnParseErrorOnce(key: string, rawValue: string, error: unknown): void {
    if (!__DEV__) {
      return;
    }

    PersistentStorage.maybeResetWarnedKeysOnOverflow();
    if (PersistentStorage.parseWarnedKeys.has(key)) return;
    PersistentStorage.parseWarnedKeys.add(key);

    const preview = rawValue.length > 160 ? `${rawValue.slice(0, 160)}…` : rawValue;
    logger.warn(`PersistentStorage.get failed to parse JSON for "${key}"`, {
      preview,
      error,
    });
  }

  private async trySelfHealOnParseError(key: string): Promise<void> {
    try {
      await this.userscript.deleteValue(key);
    } catch (error) {
      // Best-effort: do not throw from get().
      __DEV__ && logger.warn(`PersistentStorage.get failed to self-heal key "${key}"`, error);
    }
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
    } catch (error) {
      if (__DEV__ && options.warnOnParseErrorOnce !== false) {
        this.warnParseErrorOnce(key, value, error);
      }

      if (options.selfHealOnParseError === true) {
        await this.trySelfHealOnParseError(key);
      }

      return defaultValue;
    }
  }

  /**
   * Retrieve a JSON-parsed value.
   *
   * This is an explicit alias for {@link get}.
   */
  async getJson<T>(
    key: string,
    defaultValue?: T,
    options: PersistentStorageGetOptions = {}
  ): Promise<T | undefined> {
    return this.get<T>(key, defaultValue, options);
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
    try {
      await this.userscript.deleteValue(key);
    } catch (error) {
      logger.error('Storage.remove failed', key, error);
      throw error;
    }
  }
}

export function getPersistentStorage(): PersistentStorage {
  return PersistentStorage.getInstance();
}
