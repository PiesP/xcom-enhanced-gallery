import { beforeEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from '@test/utils/testing-library';
import { APP_SETTINGS_STORAGE_KEY } from '@/constants';
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

// Mock the container service accessor for settings subscription
const settingsSubscribers: Array<
  (event: { key: string; oldValue: unknown; newValue: unknown }) => void
> = [];
const fakeSettingsService = {
  get: vi.fn((key: string) => undefined),
  subscribe: vi.fn(
    (listener: (event: { key: string; oldValue: unknown; newValue: unknown }) => void) => {
      settingsSubscribers.push(listener);
      return () => {
        const idx = settingsSubscribers.indexOf(listener);
        if (idx >= 0) settingsSubscribers.splice(idx, 1);
      };
    }
  ),
};

vi.mock('@shared/container/service-accessors', () => ({
  tryGetSettingsManager: () => fakeSettingsService,
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
    // Clear any previous subscribers to avoid cross-test leakage
    settingsSubscribers.length = 0;
    fakeSettingsService.get.mockClear?.();
    fakeSettingsService.subscribe.mockClear?.();
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

  it('subscribes to SettingsService changes and updates theme accordingly', async () => {
    // Ensure no persisted setting exists
    const service = new ThemeService();
    await service.initialize();

    // Subscribe should be attached via ThemeService.onInitialize
    expect(fakeSettingsService.subscribe).toHaveBeenCalled();

    // Simulate a SettingsService change to 'dark'
    const callback = settingsSubscribers[0];
    expect(callback).toBeDefined();

    // Fire change event
    callback({ key: 'gallery.theme', oldValue: 'auto', newValue: 'dark' });

    // Theme should update
    expect(service.getCurrentTheme()).toBe('dark');
    // Persisted storage should be updated
    expect(storageState.set).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'dark');
  });

  it('re-applies persisted theme when synchronous read fallback occurs (GM_getValue returns Promise)', async () => {
    // Simulate sync read failing (returns undefined) but async read resolves to stored theme
    storageState.getSync.mockImplementation((key: string) => undefined);
    storageState.get.mockImplementation(async (key: string) => {
      if (key === APP_SETTINGS_STORAGE_KEY) return { gallery: { theme: 'dark' } };
      return undefined;
    });

    const service = new (require('@shared/services/theme-service').ThemeService)();

    // Initially should be auto (fallback)
    expect(service.getCurrentTheme()).toBe('auto');

    // Wait for async restore scheduled in constructor to update the theme
    await waitFor(() => expect(service.getCurrentTheme()).toBe('dark'));
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
