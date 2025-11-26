import { getUserscript } from '@shared/external/userscript';
import { logger } from '@shared/logging';

export class PersistentStorage {
  private static instance: PersistentStorage | null = null;
  private readonly userscript = getUserscript();

  private constructor() {}

  static getInstance(): PersistentStorage {
    if (!PersistentStorage.instance) {
      PersistentStorage.instance = new PersistentStorage();
    }
    return PersistentStorage.instance;
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
      if (error instanceof Error && error.message.includes('GM_getValue not available')) {
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

  getSync<T>(key: string, defaultValue?: T): T | undefined {
    try {
      // Direct GM access for sync
      const gmGetValue =
        typeof GM_getValue !== 'undefined'
          ? GM_getValue
          : // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).GM_getValue;
      if (!gmGetValue) return defaultValue;

      const value = gmGetValue(key);
      if (value instanceof Promise) return defaultValue;
      if (value === undefined || value === null) return defaultValue;

      try {
        return JSON.parse(value as string) as T;
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
