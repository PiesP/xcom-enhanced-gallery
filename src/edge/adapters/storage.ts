/**
 * Storage adapter for Edge layer. Provides simple async functions to get and set
 * JSON values in persistent storage by delegating to the storage service.
 *
 * @module edge/adapters/storage
 * @see {@link PersistentStorageService} for storage implementation
 * @see {@link getPersistentStorage} for service accessor
 */

import { getPersistentStorage } from '@shared/services/persistent-storage';

/**
 * Retrieve a JSON value from persistent storage
 */
export async function storeGet(key: string): Promise<unknown> {
  const storage = getPersistentStorage();
  return (await storage.getJson<unknown>(key)) as unknown;
}

/**
 * Store a JSON value in persistent storage
 */
export async function storeSet(key: string, value: unknown): Promise<void> {
  const storage = getPersistentStorage();
  await storage.setJson(key, value);
}
