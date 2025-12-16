import { getPersistentStorage } from '@shared/services/persistent-storage';

export async function storeGet(key: string): Promise<unknown> {
  const storage = getPersistentStorage();
  return (await storage.getJson<unknown>(key)) as unknown;
}

export async function storeSet(key: string, value: unknown): Promise<void> {
  const storage = getPersistentStorage();
  await storage.setJson(key, value);
}
