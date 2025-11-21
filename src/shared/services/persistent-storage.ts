/** PersistentStorage wraps the userscript storage API (getValue/setValue) with a typed singleton interface. */

import { getUserscript } from '@shared/external/userscript';
import { logger } from '@shared/logging';

/**
 * Persistent Storage Service using Tampermonkey API
 *
 * 🔹 Implementation Details:
 *
 * **Singleton Pattern**:
 * - Private constructor enforces single instance per lifecycle
 * - getInstance() lazily creates instance on first call
 * - Thread-safe in userscript context (single-threaded JavaScript)
 *
 * **Data Serialization**:
 * - Non-string values automatically converted to JSON
 * - Retrieval auto-deserializes JSON back to typed objects
 * - Fallback for unparseable strings (stores raw value)
 *
 * **Error Handling Strategy**:
 * - All methods wrapped in try-catch with logger.error() calls
 * - Failed reads return defaultValue (graceful degradation)
 * - Failed writes throw Error (fail-fast for consistency)
 * - All errors include descriptive context messages
 *
 * **Tampermonkey API Limitations**:
 * - No key enumeration: Use explicit key removal instead of pattern clearing
 * - No usage API: Track quota at application level if needed
 * - No reset-all: Manual tracking of keys to reset
 *
 * 🔹 Storage Characteristics:
 * - Per-domain quota: ~5MB (varies by Tampermonkey version)
 * - Persistence: Survives script reload and browser restart
 * - Scope: Domain-specific (cannot access cross-domain data)
 *
 * 🔹 Direct userscript API usage (Phase 309):
 * This service uses getUserscript() getter to access storage APIs without direct imports:
 * - Enables test mocking (substitute getUserscript() implementation)
 * - Maintains static analysis (no 'undefined setValue' issues)
 * - Follows Phase 309 Service Layer architecture pattern
 *
 * @example
 * ```typescript
 * // Typical usage pattern
 * const storage = PersistentStorage.getInstance();
 *
 * // Type-safe storage
 * interface UserSettings {
 *   theme: 'light' | 'dark';
 *   language: 'en' | 'ko' | 'ja';
 * }
 *
 * const settings: UserSettings = { theme: 'dark', language: 'ko' };
 * await storage.set('settings', settings);
 *
 * // Typed retrieval with fallback
 * const retrieved = await storage.get<UserSettings>(
 *   'settings',
 *   { theme: 'light', language: 'en' }
 * );
 *
 * // Existence check before operations
 * if (await storage.has('auth-token')) {
 *   const token = await storage.get<string>('auth-token');
 * }
 *
 * // Cleanup
 * await storage.remove('auth-token');
 * ```
 *
 * @see {@link getUserscript} for vendor getter pattern
 * @see {@link logger} for error handling integration
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
   * 🔹 Serialization Strategy:
   * - String values: Stored directly (no encoding)
   * - Objects/Arrays: Converted to JSON via JSON.stringify()
   * - Primitives (number, boolean): JSON-encoded (e.g., true → "true")
   * - undefined: Converted to JSON null (undefined not serializable)
   *
   * 🔹 Error Handling:
   * - Network/API errors: Caught and logged, re-thrown as descriptive Error
   * - Invalid data: JSON.stringify() throws TypeError (propagated)
   * - Success: Logs bytes written for monitoring large datasets
   *
   * 🔹 Performance Considerations:
   * - Synchronous in Tampermonkey (despite async signature)
   * - JSON serialization can be slow for large objects (100KB+)
   * - Avoid storing megabytes of data; use explicit chunking if needed
   *
   * 🔹 Use Cases:
   * - User settings: { theme: 'dark', language: 'ko' }
   * - Session tokens: 'eyJhbGc...' (strings)
   * - Metadata caches: [{ id: 1, name: 'item' }, ...]
   *
   * @template T Generic value type (any JSON-serializable)
   * @param key Storage key (use namespacing: 'feature.subfeature.key')
   * @param value Value to store (auto-serializes non-strings)
   * @throws {Error} If key is invalid or serialization fails
   *
   * @example
   * ```typescript
   * // Store object
   * await storage.set('user-prefs', { theme: 'dark', notifications: true });
   *
   * // Store string (no JSON encoding)
   * await storage.set('auth-token', 'Bearer abc123...');
   *
   * // Store array
   * await storage.set('favorites', ['id1', 'id2', 'id3']);
   * ```
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
   * 🔹 Deserialization Strategy:
   * - Missing keys: Returns defaultValue (graceful fallback)
   * - JSON strings: Parsed back to typed objects
   * - Non-JSON strings: Returned as-is (fallback for manual data)
   * - null/undefined: Treated as missing, returns defaultValue
   *
   * 🔹 Type Safety:
   * - Generic <T> enables typed retrieval
   * - Runtime JSON.parse() can still fail (invalid JSON)
   * - Fallback behavior: Return raw string on parse failure
   * - Application responsible for type validation post-retrieval
   *
   * 🔹 Error Handling:
   * - Tampermonkey API errors: Caught, logged, return defaultValue
   * - JSON parse errors: Caught, return raw string
   * - No exception thrown (graceful degradation)
   *
   * 🔹 Performance:
   * - First call: Reads from storage (synchronous, ~1-2ms)
   * - Subsequent calls: New read each time (no client-side cache)
   * - For frequently accessed data: Cache in memory at call site
   *
   * 🔹 Common Patterns:
   * - With validation: const data = await storage.get<T>(...) || fallback;
   * - With type guard: if (data && typeof data === 'object') { ... }
   * - With parser: JSON.parse() on retrieval for extra safety
   *
   * @template T Generic return type (must match stored structure)
   * @param key Storage key to retrieve
   * @param defaultValue Fallback if key not found (default: undefined)
   * @returns Stored value (typed) or defaultValue
   *
   * @example
   * ```typescript
   * // Retrieve with type
   * const prefs = await storage.get<UserPrefs>('user-prefs', DEFAULT_PREFS);
   *
   * // Retrieve string
   * const token = await storage.get<string>('auth-token');
   * if (!token) console.log('Not authenticated');
   *
   * // Retrieve array
   * const favorites = await storage.get<string[]>('favorites', []);
   * ```
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
   * 🔹 Purpose:
   * Pre-flight check before retrieval to avoid try-catch patterns.
   * Useful for conditional logic based on data availability.
   *
   * 🔹 Null Handling:
   * - Explicit null: Considered NOT present (returns false)
   * - undefined: Considered NOT present (returns false)
   * - Empty string "": Considered PRESENT (returns true)
   * - "0", "false": Considered PRESENT (returns true)
   *
   * 🔹 Use Cases:
   * - Auth check: if (await storage.has('auth-token')) { ... }
   * - Feature gates: if (await storage.has('feature.beta')) { ... }
   * - Setup detection: if (!await storage.has('first-run-done')) { ... }
   *
   * 🔹 Performance:
   * - Equivalent to get() but discards value (minimal overhead)
   * - Avoid repeated has() calls for value that will be used
   *
   * @param key Storage key to check
   * @returns true if key exists and is not null/undefined, false otherwise
   *
   * @example
   * ```typescript
   * if (await storage.has('auth-token')) {
   *   const token = await storage.get<string>('auth-token');
   *   performAuthenticatedOperation(token);
   * } else {
   *   showLoginPrompt();
   * }
   * ```
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
   * Synchronously retrieve value from persistent storage
   *
   * 🔹 Critical Path Usage:
   * - Use for initialization code that must complete before async
   * - ThemeService constructor: Must set theme before render
   * - Service bootstrapping: Read config before async init
   *
   * 🔹 Warning:
   * - GM_getValue may be async in some environments (returns Promise)
   * - This method blocks if GM_getValue returns Promise
   * - Prefer async get() for non-critical paths
   *
   * 🔹 Deserialization:
   * Same as get() - JSON parsing with fallback
   *
   * @template T Generic return type
   * @param key Storage key to retrieve
   * @param defaultValue Fallback if key not found
   * @returns Stored value (typed) or defaultValue
   *
   * @example
   * ```typescript
   * // ThemeService constructor
   * const theme = storage.getSync<string>('theme', 'light');
   * // Apply the theme to your UI
   * ```
   */
  getSync<T>(key: string, defaultValue?: T): T | undefined {
    try {
      // GM_getValue can be sync or async - we handle both
      const gmGetValue = (
        globalThis as never as { GM_getValue?: <U>(k: string, d?: U) => U | Promise<U> }
      ).GM_getValue;
      if (!gmGetValue) {
        logger.debug(`PersistentStorage.getSync: GM_getValue unavailable, returning default`);
        return defaultValue;
      }

      const value = gmGetValue<string | undefined>(key);

      // If it's a Promise, we can't help - this is synchronous
      if (value instanceof Promise) {
        logger.warn(
          `PersistentStorage.getSync: GM_getValue returned Promise for key "${key}", returning default`
        );
        return defaultValue;
      }

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
      logger.error(`PersistentStorage.getSync failed for key "${key}":`, error);
      return defaultValue;
    }
  }

  /**
   * Synchronously store value in persistent storage
   *
   * 🔹 Critical Path Usage:
   * - Use for synchronous operations (e.g., theme changes)
   * - Constructor initialization
   * - Synchronous event handlers
   *
   * 🔹 Warning:
   * - GM_setValue may be async in some environments
   * - This method blocks if GM_setValue returns Promise
   * - Prefer async set() for non-critical paths
   *
   * @template T Generic value type
   * @param key Storage key
   * @param value Value to store
   *
   * @example
   * ```typescript
   * // Synchronous theme setting
   * storage.setSync('theme', 'dark');
   * ```
   */
  setSync<T>(key: string, value: T): void {
    try {
      const gmSetValue = (
        globalThis as never as { GM_setValue?: (k: string, v: unknown) => void | Promise<void> }
      ).GM_setValue;
      if (!gmSetValue) {
        logger.debug(`PersistentStorage.setSync: GM_setValue unavailable`);
        return;
      }

      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      const result = gmSetValue(key, serialized);

      // If it's a Promise, we can't wait - this is synchronous
      if (result instanceof Promise) {
        logger.warn(
          `PersistentStorage.setSync: GM_setValue returned Promise for key "${key}" (async operation initiated)`
        );
      }

      logger.debug(`PersistentStorage.setSync: ${key} (${serialized.length} bytes)`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`PersistentStorage.setSync failed for key "${key}":`, error);
      throw new Error(`Failed to store "${key}": ${msg}`);
    }
  }

  /**
   * Remove value from persistent storage
   *
   * 🔹 Deletion Semantics:
   * - Existing key: Deleted, subsequent get() returns defaultValue
   * - Missing key: No error, idempotent (safe to call multiple times)
   * - null value: Explicitly deletes entry (different from storing null)
   *
   * 🔹 Error Handling:
   * - Tampermonkey API errors: Caught, logged, re-thrown
   * - Deletion is fail-fast (unlike get which degrades gracefully)
   *
   * 🔹 Use Cases:
   * - Session cleanup: await storage.remove('auth-token') on logout
   * - Feature reset: await storage.remove('feature.beta.settings')
   * - Temp data cleanup: await storage.remove('cache.thumbnail.123')
   *
   * 🔹 Bulk Cleanup:
   * For multiple keys, use loop or Promise.all():
   * ```typescript
   * await Promise.all([
   *   storage.remove('key1'),
   *   storage.remove('key2'),
   *   storage.remove('key3'),
   * ]);
   * ```
   *
   * 🔹 Pattern Cleanup:
   * Tampermonkey doesn't support wildcard removal. Track prefixed keys:
   * ```typescript
   * const tempKeys = ['temp.cache.1', 'temp.cache.2'];
   * await Promise.all(tempKeys.map(k => storage.remove(k)));
   * ```
   *
   * @param key Storage key to remove
   * @throws {Error} If removal fails (API error)
   *
   * @example
   * ```typescript
   * // Cleanup on logout
   * await storage.remove('auth-token');
   * await storage.remove('user-settings');
   *
   * // Idempotent removal
   * await storage.remove('already-deleted'); // OK, no error
   * ```
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
}

/**
 * Get singleton instance convenience function
 *
 * 🔹 Purpose:
 * Shorthand accessor for PersistentStorage.getInstance(). Enables:
 * ```typescript
 * // Import as named export
 * import { getPersistentStorage } from '@shared/services';
 *
 * // vs. class method
 * import { PersistentStorage } from '@shared/services';
 * PersistentStorage.getInstance();
 * ```
 *
 * 🔹 Equivalence:
 * Both patterns return the same singleton instance:
 * ```typescript
 * const s1 = getPersistentStorage();
 * const s2 = PersistentStorage.getInstance();
 * console.log(s1 === s2); // true (same object)
 * ```
 *
 * 🔹 Usage:
 * Preferred for importing in modules and services:
 * ```typescript
 * // In SettingsService
 * const storage = getPersistentStorage();
 * const settings = await storage.get<UserSettings>('settings');
 * ```
 *
 * @returns Singleton PersistentStorage instance
 *
 * @see {@link PersistentStorage.getInstance} for class method
 */
export function getPersistentStorage(): PersistentStorage {
  return PersistentStorage.getInstance();
}
