import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { storageAdapter } = vi.hoisted(() => ({
  storageAdapter: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    listKeys: vi.fn(),
  },
}));

vi.mock('@platform/index', () => ({
  getStorageAdapter: () => storageAdapter,
}));

import {
  PersistentStorage,
  resetPersistentStorageForTests,
} from '@shared/services/persistent-storage';

describe('PersistentStorage', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    resetPersistentStorageForTests();
  });

  it('prefers a newer fallback value when primary storage recovered with stale data', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    storageAdapter.set.mockRejectedValueOnce(new Error('primary unavailable'));

    const storage = new PersistentStorage();
    await storage.set('setting', 'new-value');

    storageAdapter.get.mockResolvedValueOnce(
      JSON.stringify({
        __xegStorageEnvelope: 1,
        updatedAt: 500,
        value: 'old-value',
      })
    );

    await expect(storage.get('setting')).resolves.toBe('new-value');
  });

  it('keeps legacy primary values readable', async () => {
    storageAdapter.get.mockResolvedValueOnce(JSON.stringify('legacy-value'));

    await expect(new PersistentStorage().get('setting')).resolves.toBe('legacy-value');
  });
});
