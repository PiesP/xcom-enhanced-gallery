import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

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

  it('orders a failed-primary fallback above an old primary in the same millisecond', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(100);
    const primary = JSON.stringify({ __xegStorageEnvelope: 1, updatedAt: 100, value: 'old' });
    storageAdapter.get.mockResolvedValue(primary);
    storageAdapter.set.mockRejectedValueOnce(new Error('primary denied'));

    const storage = new PersistentStorage();
    await storage.set('setting', 'new');
    await expect(storage.get('setting')).resolves.toBe('new');
  });

  it('keeps a newer primary ahead of stale fallback when cleanup fails', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(100);
    const fallback = new Map<string, string>([
      [
        'xeg-fallback:setting',
        JSON.stringify({ __xegStorageEnvelope: 1, updatedAt: 100, value: 'old' }),
      ],
    ]);
    let primary: string | undefined;
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => fallback.get(key) ?? null,
      setItem: (key: string, value: string) => fallback.set(key, value),
      removeItem: () => {
        throw new Error('cleanup denied');
      },
    });
    storageAdapter.get.mockImplementation(async () => primary);
    storageAdapter.set.mockImplementation(async (_key: string, value: string) => {
      primary = value;
    });

    const storage = new PersistentStorage();
    await storage.set('setting', 'new');
    expect(fallback.has('xeg-fallback:setting')).toBe(true);
    await expect(storage.get('setting')).resolves.toBe('new');
  });

  it('orders a new write after a clock rollback and keeps legacy values readable', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(500);
    const primary = JSON.stringify({ __xegStorageEnvelope: 1, updatedAt: 1_000, value: 'old' });
    storageAdapter.get.mockResolvedValue(primary);
    storageAdapter.set.mockRejectedValueOnce(new Error('primary denied'));

    const storage = new PersistentStorage();
    await storage.set('setting', 'new');
    await expect(storage.get('setting')).resolves.toBe('new');
  });

  it('does not report success when both storage backends reject a write', async () => {
    storageAdapter.set.mockRejectedValueOnce(new Error('primary denied'));
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('fallback denied');
      },
    });

    await expect(new PersistentStorage().set('setting', 'new')).rejects.toThrow(
      'No settings storage accepted the write'
    );
  });

  it('serializes same-key writes so a delayed older attempt cannot replace a newer one', async () => {
    let releaseFirst: () => void = () => undefined;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    let firstStarted: () => void = () => undefined;
    const firstStartedGate = new Promise<void>((resolve) => {
      firstStarted = resolve;
    });
    let primary: string | undefined;
    storageAdapter.get.mockImplementation(async () => primary);
    let writes = 0;
    storageAdapter.set.mockImplementation(async (_key: string, value: string) => {
      writes++;
      if (writes === 1) {
        firstStarted();
        await firstGate;
      }
      primary = value;
    });
    const storage = new PersistentStorage();
    const older = storage.set('setting', 'older');
    await firstStartedGate;
    const newer = storage.set('setting', 'newer');
    expect(writes).toBe(1);
    releaseFirst();
    await Promise.all([older, newer]);
    await expect(storage.get('setting')).resolves.toBe('newer');
  });
});
