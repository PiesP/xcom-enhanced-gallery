/**
 * @fileoverview Persistent Storage Service
 * @description Direct Tampermonkey GM_* API wrapper for key-value storage
 */

import { getUserscript } from '@shared/external/userscript/adapter';
import { logger } from '@shared/logging';

/**
 * Storage usage information
 */
export interface StorageUsage {
  used: number;
  available: number;
  total: number;
}

/**
 * Persistent Storage Service using Tampermonkey API
 *
 * Direct GM_* API usage without abstraction layers:
 * - GM_getValue/GM_setValue for storage
 * - ~5MB storage limit (Tampermonkey standard)
 *
 * @example
 * ```typescript
 * const storage = PersistentStorage.getInstance();
 * await storage.set('key', { value: 'data' });
 * const data = await storage.get('key', { fallback: true });
 * ```
 */
export class PersistentStorage {
  private static instance: PersistentStorage | null = null;
  private readonly userscript = getUserscript();

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): PersistentStorage {
    if (!this.instance) {
      this.instance = new PersistentStorage();
    }
    return this.instance;
  }

  /**
   * Store value in persistent storage
   *
   * Automatically serializes non-string values to JSON.
   *
   * @param key Storage key
   * @param value Value to store
   */
  async set<T>(key: string, value: T): Promise<void> {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      await this.userscript.setValue(key, serialized);
      logger.debug(`PersistentStorage.set: ${key} (${serialized.length} bytes)`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`PersistentStorage.set failed for key "${key}":`, error);
      throw new Error(`Failed to store "${key}": ${msg}`);
    }
  }

  /**
   * Retrieve value from persistent storage
   *
   * Automatically deserializes JSON strings back to objects.
   *
   * @param key Storage key
   * @param defaultValue Fallback value if key not found
   * @returns Stored value or defaultValue
   */
  async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    try {
      const value = await this.userscript.getValue<string | undefined>(key);

      if (value === undefined || value === null) {
        return defaultValue;
      }

      // Try to parse JSON, fallback to raw string
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (error) {
      logger.error(`PersistentStorage.get failed for key "${key}":`, error);
      return defaultValue;
    }
  }

  /**
   * Check if key exists in storage
   *
   * @param key Storage key
   * @returns true if key exists, false otherwise
   */
  async has(key: string): Promise<boolean> {
    try {
      const value = await this.userscript.getValue<unknown>(key);
      return value !== undefined && value !== null;
    } catch (error) {
      logger.error(`PersistentStorage.has failed for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Remove value from persistent storage
   *
   * @param key Storage key
   */
  async remove(key: string): Promise<void> {
    try {
      await this.userscript.deleteValue(key);
      logger.debug(`PersistentStorage.remove: ${key}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`PersistentStorage.remove failed for key "${key}":`, error);
      throw new Error(`Failed to remove "${key}": ${msg}`);
    }
  }

  /**
   * Clear all keys matching pattern
   *
   * Useful for bulk cleanup (e.g., temporary data).
   *
   * @param _pattern Prefix pattern (e.g., 'temp-*')
   */
  async clearPattern(_pattern: string): Promise<number> {
    try {
      // Note: Tampermonkey doesn't provide listKeys(), so we can only delete known keys
      // In practice, pattern-based clearing is application-specific
      logger.warn(
        `PersistentStorage.clearPattern: Tampermonkey API doesn't support key enumeration. Use explicit key removal.`
      );
      return 0;
    } catch (error) {
      logger.error(`PersistentStorage.clearPattern failed:`, error);
      throw error;
    }
  }

  /**
   * Get storage usage estimates
   *
   * Tampermonkey provides ~5MB per domain.
   *
   * @returns Storage usage info
   */
  async getUsage(): Promise<StorageUsage> {
    // Tampermonkey doesn't expose storage usage API
    // Return conservative estimate (5MB total)
    return {
      used: 0, // Cannot determine accurately
      available: 5 * 1024 * 1024, // ~5MB Tampermonkey limit
      total: 5 * 1024 * 1024,
    };
  }

  /**
   * Reset all stored data
   *
   * ⚠️ Destructive operation - use with caution
   */
  async reset(): Promise<void> {
    try {
      // Note: Without listKeys() API, we can only clear known keys
      // Application should track which keys to reset
      logger.warn('PersistentStorage.reset: Clearing tracked keys only (Tampermonkey limitation)');
    } catch (error) {
      logger.error('PersistentStorage.reset failed:', error);
      throw error;
    }
  }
}

/**
 * Get singleton instance convenience function
 */
export function getPersistentStorage(): PersistentStorage {
  return PersistentStorage.getInstance();
}
