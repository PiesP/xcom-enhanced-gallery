import { beforeEach, describe, expect, it, vi } from 'vitest';

const storageMocks = vi.hoisted(() => ({
  storageGet: vi.fn<() => Promise<string | undefined>>(),
  storageSet: vi.fn<(key: string, value: string) => Promise<void>>(),
}));

const { storageGet, storageSet } = storageMocks;

vi.mock('@shared/services/persistent-storage', () => ({
  getPersistentStorage: () => ({
    get: storageMocks.storageGet,
    set: storageMocks.storageSet,
  }),
}));

vi.mock('@shared/utils/theme-dom', () => ({
  syncThemeAttributes: vi.fn(),
}));

// The module under test is imported after mocks are declared.
import { ThemeService } from '@shared/services/theme-service';

const MATCH_MEDIA_RESULT = {
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
};

function ensureMatchMedia(): void {
  if (typeof window === 'undefined') {
    return;
  }

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockReturnValue(MATCH_MEDIA_RESULT),
  });
}

describe('ThemeService storage reconciliation', () => {
  beforeEach(() => {
    storageGet.mockReset();
    storageSet.mockReset();
    storageSet.mockResolvedValue(undefined);
    getTestStorage().clear();
    ensureMatchMedia();
  });

  it('prefers local manual theme when persistent is stuck on auto', async () => {
    storageGet.mockResolvedValue('auto');
    const storage = getTestStorage();
    storage.setItem('xeg-theme', 'dark');

    const service = new ThemeService();
    await service.initialize();

    expect(service.getCurrentTheme()).toBe('dark');
    expect(storageSet).toHaveBeenCalledWith(expect.any(String), 'dark');
  });

  it('prefers persistent manual theme when local value is auto', async () => {
    storageGet.mockResolvedValue('light');
    const storage = getTestStorage();
    storage.setItem('xeg-theme', 'auto');

    const service = new ThemeService();
    await service.initialize();

    expect(service.getCurrentTheme()).toBe('light');
    expect(storage.getItem('xeg-theme')).toBe('light');
  });

  it('defaults to auto when no stored value exists', async () => {
    storageGet.mockResolvedValue(undefined);
    getTestStorage().removeItem('xeg-theme');

    const service = new ThemeService();
    await service.initialize();

    expect(service.getCurrentTheme()).toBe('auto');
    expect(storageSet).not.toHaveBeenCalled();
  });
});

type TestStorage = NonNullable<typeof globalThis.localStorage>;

function getTestStorage(): TestStorage {
  const storage = globalThis.localStorage;
  if (!storage) {
    throw new Error('localStorage is not available in the test environment');
  }
  return storage;
}
