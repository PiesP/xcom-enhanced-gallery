import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import { SettingsService } from '@/features/settings/services/settings-service';
import { DEFAULT_SETTINGS } from '@/constants';

const STORAGE_KEY = 'xeg-app-settings';

function stripVolatile(obj: any) {
  const { lastModified, __schemaHash, ...rest } = obj;
  return rest;
}

// Phase 354: PersistentStorage mock
vi.mock('@shared/services/persistent-storage', () => {
  const store = new Map<string, string>();

  const serialize = (value: unknown): string =>
    typeof value === 'string' ? value : JSON.stringify(value);

  const deserialize = <T>(value: string | undefined, fallback?: T): T | undefined => {
    if (value === undefined) {
      return fallback;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  };
  return {
    getPersistentStorage: vi.fn(() => ({
      get: vi.fn(<T>(key: string, defaultValue?: T) =>
        Promise.resolve(deserialize<T>(store.get(key), defaultValue))
      ),
      set: vi.fn((key: string, value: unknown) => {
        store.set(key, serialize(value));
        return Promise.resolve();
      }),
      remove: vi.fn((key: string) => {
        store.delete(key);
        return Promise.resolve();
      }),
      // Test helper: direct access to store
      __testStore: store,
    })),
  };
});

describe('SettingsService – SETTINGS-MIG-HASH-01', () => {
  setupGlobalTestIsolation();

  type MockStorage = {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    __testStore: Map<string, string>;
  };

  let mockStorage: MockStorage;

  beforeEach(async () => {
    vi.useFakeTimers();

    // Reset mock storage
    const { getPersistentStorage } = await import('@shared/services/persistent-storage');
    mockStorage = (getPersistentStorage as unknown as () => MockStorage)();
    mockStorage.__testStore.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('migrates and saves when stored __schemaHash mismatches current', async () => {
    // Simulate older stored settings missing some keys and with old hash
    const legacy: any = {
      version: '0.9.0',
      gallery: { enableKeyboardNav: false },
      __schemaHash: 'deadbeef',
      lastModified: Date.now() - 1000,
    };
    mockStorage.__testStore.set(STORAGE_KEY, JSON.stringify(legacy));

    const svc = new SettingsService();
    await svc.initialize();

    const savedJson = mockStorage.__testStore.get(STORAGE_KEY) as string;
    expect(savedJson).toBeDefined();
    const saved = JSON.parse(savedJson!) as any;
    expect(saved.__schemaHash).toBeTypeOf('string');
    // The service should have filled defaults while preserving explicit values
    expect(saved.gallery.enableKeyboardNav).toBe(false);
    expect(saved.download).toBeDefined();
    expect(saved.tokens).toBeDefined();
  });

  it('first-run initializes defaults and writes current __schemaHash', async () => {
    const svc = new SettingsService();
    await svc.initialize();
    const savedJson = mockStorage.__testStore.get(STORAGE_KEY) as string;
    expect(savedJson).toBeDefined();
    const saved = JSON.parse(savedJson!) as any;
    expect(saved.__schemaHash).toBeTypeOf('string');
    expect(stripVolatile(saved)).toEqual(stripVolatile(DEFAULT_SETTINGS));
  });

  it('idempotent: repeated initialize does not change persisted structure', async () => {
    const svc = new SettingsService();
    await svc.initialize();
    const firstJson = mockStorage.__testStore.get(STORAGE_KEY) as string;
    expect(firstJson).toBeDefined();
    const first = JSON.parse(firstJson!) as any;
    await svc.cleanup();

    const svc2 = new SettingsService();
    await svc2.initialize();
    const secondJson = mockStorage.__testStore.get(STORAGE_KEY) as string;
    expect(secondJson).toBeDefined();
    const second = JSON.parse(secondJson!) as any;

    expect(stripVolatile(second)).toEqual(stripVolatile(first));
    expect(second.__schemaHash).toEqual(first.__schemaHash);
  });
});
