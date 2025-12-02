// Import only types from 'vitest' to avoid duplicate identifier with vitest/globals
import type { Mock } from 'vitest';
import { ThemeService } from '@/shared/services/theme-service';
import { getPersistentStorage } from '@/shared/services/persistent-storage';
import * as themeDom from '@shared/dom/theme';

vi.mock('@shared/dom/theme', () => ({
  syncThemeAttributes: vi.fn(),
}));

vi.mock('@/shared/services/persistent-storage', () => ({
  getPersistentStorage: vi.fn(),
}));

vi.mock('@/shared/container/service-accessors', () => ({
  tryGetSettingsManager: vi.fn(),
}));

describe('ThemeService onInitialize coverage', () => {
  let storageMock: any;
  let mediaQueryListMock: any;
  let settingsServiceMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton
    (ThemeService as unknown as { instance?: unknown }).instance = undefined;

    // Storage mock
    storageMock = {
      getSync: vi.fn().mockReturnValue({ gallery: { theme: 'auto' } }),
      get: vi.fn().mockResolvedValue({ gallery: { theme: 'auto' } }),
    };
    (getPersistentStorage as any).mockReturnValue(storageMock);

    // MediaQueryList mock
    mediaQueryListMock = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    const mm = vi.fn().mockReturnValue(mediaQueryListMock);
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mm,
    });

    // settings service mock
    settingsServiceMock = {
      get: vi.fn(),
      set: vi.fn(),
      subscribe: vi.fn().mockReturnValue(vi.fn()),
    };
  });

  it('onInitialize should update theme from async storage and bind settings manager', async () => {
    // storage returns dark on async call
    storageMock.getSync.mockReturnValue({ gallery: { theme: 'light' } });
    storageMock.get.mockResolvedValue({ gallery: { theme: 'dark' } });

    const { tryGetSettingsManager } = await import('@/shared/container/service-accessors');
    (tryGetSettingsManager as Mock).mockReturnValue(settingsServiceMock);

    const service = new ThemeService();
    // Call protected method directly
    await (service as unknown as any).onInitialize();

    expect(service.getCurrentTheme()).toBe('dark');
    expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith('dark');
    // bindSettingsService should have subscribed to settings changes
    expect(settingsServiceMock.subscribe).toHaveBeenCalled();
  });

  it('initializeSystemDetection should register mediaQueryList change handler when auto', async () => {
    // Ensure themeSetting remains auto
    storageMock.getSync.mockReturnValue({ gallery: { theme: 'auto' } });
    storageMock.get.mockResolvedValue({ gallery: { theme: 'auto' } });

    const service = new ThemeService();
    // trigger onInitialize directly to ensure initializeSystemDetection runs after async path
    await (service as unknown as any).onInitialize();

    expect(mediaQueryListMock.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('onInitialize should handle missing settings manager without throwing', async () => {
    const { tryGetSettingsManager } = await import('@/shared/container/service-accessors');
    (tryGetSettingsManager as Mock).mockReturnValue(null);

    const service = new ThemeService();
    await expect((service as unknown as any).onInitialize()).resolves.not.toThrow();
  });
});
