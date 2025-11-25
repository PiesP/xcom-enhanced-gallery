import { CoreService } from '@shared/services/core-service-manager';

// Lightweight cache for frequently accessed services; avoids repeated lookups.
const cache = new Map<string, unknown>();

function setCache<T>(key: string, instance: T): T {
  cache.set(key, instance);
  return instance;
}

export const CoreServiceRegistry = {
  register<T>(key: string, instance: T): void {
    CoreService.getInstance().register<T>(key, instance);
    setCache(key, instance);
  },
  get<T>(key: string): T {
    if (cache.has(key)) {
      return cache.get(key) as T;
    }
    const instance = CoreService.getInstance().get<T>(key);
    return setCache(key, instance);
  },
  tryGet<T>(key: string): T | null {
    if (cache.has(key)) {
      return cache.get(key) as T;
    }
    const instance = CoreService.getInstance().tryGet<T>(key);
    if (instance !== null) {
      setCache(key, instance);
    }
    return instance;
  },
  invalidateCache(key: string): void {
    cache.delete(key);
  },
  clearCache(): void {
    cache.clear();
  },
  getCacheKeys(): string[] {
    return Array.from(cache.keys());
  },
};

export function registerService<T>(key: string, instance: T): void {
  CoreServiceRegistry.register<T>(key, instance);
}

export function getService<T>(key: string): T {
  return CoreServiceRegistry.get<T>(key);
}

export function tryGetService<T>(key: string): T | null {
  return CoreServiceRegistry.tryGet<T>(key);
}
