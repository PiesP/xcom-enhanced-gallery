import { beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_SETTINGS_STORAGE_KEY } from '@/constants/storage';
import { THEME_STORAGE_KEY } from '@shared/constants';

const storageState = vi.hoisted(() => {
  const data = new Map<string, unknown>();

  const get = vi.fn(async (key: string) => data.get(key));
  const getSync = vi.fn((key: string) => data.get(key));
  const set = vi.fn(async (key: string, value: unknown) => {
    data.set(key, value);
  });

  return {
    data,
    get,
    getSync,
    set,
    reset(): void {
      data.clear();
      get.mockClear();
      getSync.mockClear();
      set.mockClear();
    },
  };
});

vi.mock('@shared/services/persistent-storage', () => ({
  getPersistentStorage: () => ({
    get: storageState.get,
    getSync: storageState.getSync,
    set: storageState.set,
    setSync: vi.fn(),
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

describe('ThemeService storage (Phase 420: PersistentStorage only)', () => {
  beforeEach(() => {
    storageState.reset();
    ensureMatchMedia();
  });

  it('loads manual theme from settings snapshot when available', async () => {
    storageState.data.set(APP_SETTINGS_STORAGE_KEY, { gallery: { theme: 'dark' } });

    const service = new ThemeService();
    await service.initialize();

    expect(service.getCurrentTheme()).toBe('dark');
  });

  it('falls back to legacy theme storage when settings snapshot is missing', async () => {
    storageState.data.set(THEME_STORAGE_KEY, 'light');

    const service = new ThemeService();
    await service.initialize();

    expect(service.getCurrentTheme()).toBe('light');
  });

  it('defaults to auto when no stored value exists', async () => {
    const service = new ThemeService();
    await service.initialize();

    expect(service.getCurrentTheme()).toBe('auto');
    expect(storageState.set).not.toHaveBeenCalled();
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
