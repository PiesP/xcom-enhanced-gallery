import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThemeService } from '@/shared/services/theme-service';
import { PersistentStorage } from '@/shared/services/persistent-storage';
import { APP_SETTINGS_STORAGE_KEY } from '@/constants';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: true, // System is dark
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('ThemeService Reproduction', () => {
  let storageMock: any;

  beforeEach(() => {
    // Mock PersistentStorage
    storageMock = {
      getSync: vi.fn(),
      get: vi.fn(),
      set: vi.fn(),
    };

    // Mock getInstance to return our mock
    vi.spyOn(PersistentStorage, 'getInstance').mockReturnValue(storageMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should recover from async storage read failure on initialization', async () => {
    // Simulate getSync failing (returning undefined) due to async GM
    storageMock.getSync.mockReturnValue(undefined);

    // Simulate async get returning 'light'
    storageMock.get.mockImplementation(async (key: string) => {
      if (key === APP_SETTINGS_STORAGE_KEY) {
        return { gallery: { theme: 'light' } };
      }
      return null;
    });

    // Initialize ThemeService
    const themeService = new ThemeService();

    // Initially it should be 'auto' (fallback)
    // Since system is dark (mocked), effective theme is dark
    expect(themeService.getCurrentTheme()).toBe('auto');
    expect(themeService.getEffectiveTheme()).toBe('dark');

    // Wait for async restore (microtasks)
    await new Promise(resolve => setTimeout(resolve, 0));

    // Should be 'light' now
    expect(themeService.getCurrentTheme()).toBe('light');
    expect(themeService.getEffectiveTheme()).toBe('light');
  });

  it('applies the current theme to scopes added after initialization', async () => {
    storageMock.getSync.mockReturnValue('light');
    storageMock.get.mockResolvedValue('light');

    const themeService = new ThemeService();
    await themeService.initialize();

    const scope = document.createElement('div');
    scope.className = 'xeg-theme-scope';
    document.body.append(scope);

    await Promise.resolve();

    expect(scope.getAttribute('data-theme')).toBe('light');

    scope.remove();
  });
});
