/**
 * @fileoverview Storage adapter for Edge layer persistent storage access
 *
 * Provides simple async functions to get and set JSON values in persistent storage.
 * Delegates all storage operations to the persistent storage service singleton,
 * enabling centralized storage lifecycle management and test mocking.
 *
 * @remarks
 * **Purpose**:
 * - Adapter between Edge layer and shared persistent storage service
 * - Uniform interface for key-value JSON storage operations
 * - Centralized service access through getPersistentStorage()
 *
 * **Architecture Pattern**:
 * - Service delegation: Functions delegate to PersistentStorageService singleton
 * - JSON serialization: Automatic JSON encode/decode handled by service
 * - Type safety: Generic type parameter T for type-safe retrieval
 * - Async operations: All functions are Promise-based for non-blocking I/O
 *
 * **Design Principles**:
 * 1. **Delegation Pattern**: All operations delegate to PersistentStorageService
 * 2. **Service Singleton**: Uses getPersistentStorage() for service access
 * 3. **Type Flexibility**: storeGet returns unknown, can be narrowed by caller
 * 4. **Error Propagation**: Service errors propagate to caller
 * 5. **Async/Await**: Promise-based API for async operations
 *
 * **Storage Semantics**:
 * - Keys are strings, identifying stored values
 * - Values are automatically serialized to/from JSON by service
 * - Storage is persistent across userscript restarts
 * - Get operations return unknown type (caller responsibility to narrow type)
 * - Set operations overwrite existing values
 *
 * **Usage Example**:
 * Store user preferences as JSON object:
 *
 * const prefs = { theme: 'dark', language: 'en' };
 * await storeSet('userPrefs', prefs);
 *
 * Retrieve and use preferences:
 *
 * const stored = await storeGet('userPrefs');
 * const prefs = stored as typeof initialPrefs;
 *
 * @module edge/adapters/storage
 * @see {@link PersistentStorageService} for storage implementation
 * @see {@link getPersistentStorage} for service accessor
 */

import { getPersistentStorage } from '@shared/services/persistent-storage';

/**
 * Retrieve a JSON value from persistent storage
 *
 * Fetches a value by key from the persistent storage service and returns it
 * as-is. The caller is responsible for type narrowing the result.
 *
 * @param key - Storage key identifier
 * @returns Promise resolving to the stored value (unknown type), or undefined if not found
 *
 * @remarks
 * **Behavior**:
 * - Delegates to getPersistentStorage().getJson()
 * - Returns unknown type (not typed to avoid assumptions)
 * - Caller must narrow type via assertion or type guard
 * - Returns undefined if key not found
 * - Rejects if storage is unavailable
 *
 * **Error Handling**:
 * - Propagates service errors (storage not available, corrupt data, etc.)
 * - Caller should wrap in try/catch for error handling
 *
 * **Type Narrowing**:
 * - const value = await storeGet('key') as MyType;
 * - const value = await storeGet('key') as typeof defaultValue;
 * - Use type predicates for safe narrowing
 *
 * @example
 * Basic retrieval:
 *
 * const value = await storeGet('myKey');
 * if (value !== undefined) {
 *   console.log('Found:', value);
 * }
 *
 * Type-safe retrieval:
 *
 * interface Config { theme: string; fontSize: number; }
 * const config = await storeGet('config') as Config;
 * console.log('Theme:', config.theme);
 */
export async function storeGet(key: string): Promise<unknown> {
  const storage = getPersistentStorage();
  return (await storage.getJson<unknown>(key)) as unknown;
}

/**
 * Store a JSON value in persistent storage
 *
 * Saves a value to persistent storage by key. The value is automatically
 * serialized to JSON by the storage service.
 *
 * @param key - Storage key identifier
 * @param value - Value to store (will be JSON serialized by service)
 * @returns Promise that resolves when storage operation completes
 *
 * @remarks
 * **Behavior**:
 * - Delegates to getPersistentStorage().setJson()
 * - Automatically serializes value to JSON
 * - Overwrites existing value for same key
 * - Operation is async and may take time to persist
 * - Promise resolves after successful write
 *
 * **Type Flexibility**:
 * - Accepts any type (value: unknown)
 * - Service handles JSON serialization
 * - Non-JSON-serializable values may throw or be lost
 *
 * **Error Handling**:
 * - Propagates service errors (quota exceeded, storage unavailable, etc.)
 * - Caller should wrap in try/catch for error handling
 *
 * **Performance**:
 * - Async operation (I/O bound)
 * - May block temporarily during serialization
 * - Consider batching multiple writes
 *
 * @example
 * Store simple value:
 *
 * await storeSet('myKey', 'hello');
 * await storeSet('count', 42);
 *
 * Store object:
 *
 * const config = { theme: 'dark', fontSize: 14 };
 * await storeSet('config', config);
 *
 * Error handling:
 *
 * try {
 *   await storeSet('key', largeObject);
 * } catch (error) {
 *   console.error('Storage failed:', error);
 * }
 */
export async function storeSet(key: string, value: unknown): Promise<void> {
  const storage = getPersistentStorage();
  await storage.setJson(key, value);
}
