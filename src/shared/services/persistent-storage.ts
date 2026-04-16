import { getUserscript, type UserscriptAPI } from '@shared/external/userscript/adapter';
import { logger } from '@shared/logging/logger';
import type { PersistentStorageGetOptions } from '@shared/services/persistent-storage.contract';
import { createSingleton } from '@shared/utils/types/singleton';

export type { PersistentStorageGetOptions } from '@shared/services/persistent-storage.contract';

export class PersistentStorage {
  private get userscript(): UserscriptAPI {
    return getUserscript();
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

  private async deleteValueWithWarning(key: string, message: string): Promise<void> {
    __DEV__ && logger.warn(message);
    await this.userscript.deleteValue(key);
  }

  private async storeSerializedValue(
    key: string,
    serialized: string | undefined,
    deleteMessage: string
  ): Promise<void> {
    if (serialized === undefined) {
      await this.deleteValueWithWarning(key, deleteMessage);
      return;
    }

    await this.userscript.setValue(key, serialized);
  }

  private async getStoredString(key: string): Promise<string | undefined> {
    const value = await this.userscript.getValue<string | undefined>(key);
    return value === undefined || value === null ? undefined : value;
  }

  private getStoredStringSync(key: string): string | undefined {
    const value = this.userscript.getValueSync<string>(key);
    return value === undefined || value === null ? undefined : value;
  }

  private unwrapStoredString(rawValue: string): string {
    const parsedString = this.parseMaybeJsonString(rawValue);
    return parsedString ?? rawValue;
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
      await this.storeSerializedValue(
        key,
        value === undefined ? undefined : JSON.stringify(value),
        value === undefined
          ? `PersistentStorage.setJson received undefined for "${key}", deleting key`
          : `PersistentStorage.setJson received a non-serializable value for "${key}", deleting key`
      );
    } catch (error) {
      if (__DEV__) {
        logger.error('Storage.setJson failed', key, error);
      }
      throw error;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await this.storeSerializedValue(
        key,
        value === undefined ? undefined : this.serializeValueForStorage(value),
        value === undefined
          ? `PersistentStorage.set received undefined for "${key}", deleting key`
          : `PersistentStorage.set received a non-serializable value for "${key}", deleting key`
      );
    } catch (error) {
      if (__DEV__) {
        logger.error('Storage.set failed', key, error);
      }
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
    const value = await this.getStoredString(key);
    if (value === undefined) return defaultValue;
    return this.unwrapStoredString(value);
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
    const value = await this.getStoredString(key);
    if (value === undefined) return defaultValue;

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
   * Use only where async bootstrap is unavailable and default fallback is acceptable.
   */
  getSync<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const value = this.getStoredStringSync(key);
      if (value === undefined) return defaultValue;

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
      const value = this.getStoredStringSync(key);
      if (value === undefined) return defaultValue;
      return this.unwrapStoredString(value);
    } catch {
      return defaultValue;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await this.userscript.deleteValue(key);
    } catch (error) {
      if (__DEV__) {
        logger.error('Storage.remove failed', key, error);
      }
      throw error;
    }
  }
}

export function getPersistentStorage(): PersistentStorage {
  return PersistentStorage.getInstance();
}
