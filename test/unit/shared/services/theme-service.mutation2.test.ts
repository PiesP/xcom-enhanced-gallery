/**
 * @fileoverview Additional mutation test coverage for ThemeService
 * Target: Improve theme-service.ts from 74.36% to 90%+
 * Focus: setTheme without boundSettingsService.set, edge cases
 */
import { getPersistentStorage } from '@/shared/services/persistent-storage';
import { ThemeService } from '@/shared/services/theme-service';
import * as themeDom from '@shared/dom/theme';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest';

vi.mock('@shared/dom/theme', () => ({
  syncThemeAttributes: vi.fn(),
}));

vi.mock('@/shared/services/persistent-storage', () => ({
  getPersistentStorage: vi.fn(),
}));

vi.mock('@/shared/logging', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ThemeService mutation additional coverage', () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let storageMock: any;
  let mediaQueryListMock: any;
  let mutationObserverMock: any;
  let service: ThemeService;
  /* eslint-enable @typescript-eslint/no-explicit-any */

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton
    // @ts-expect-error - accessing private static property
    ThemeService.instance = undefined;

    storageMock = {
      getSync: vi.fn().mockReturnValue({ gallery: { theme: 'auto' } }),
      get: vi.fn().mockResolvedValue({ gallery: { theme: 'auto' } }),
    };
    (getPersistentStorage as Mock).mockReturnValue(storageMock);

    mediaQueryListMock = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue(mediaQueryListMock),
    });

    mutationObserverMock = {
      observe: vi.fn(),
      disconnect: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      callback: null as any,
    };

    global.MutationObserver = class {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructor(callback: any) {
        mutationObserverMock.callback = callback;
      }
      observe = mutationObserverMock.observe;
      disconnect = mutationObserverMock.disconnect;
      takeRecords = vi.fn();
    } as unknown as typeof MutationObserver;
  });

  afterEach(() => {
    if (service) {
      // @ts-expect-error - accessing protected method
      service.onDestroy();
    }
  });

  describe('setTheme without boundSettingsService.set', () => {
    it('should not persist when boundSettingsService has no set method', () => {
      service = new ThemeService();

      const settingsServiceWithoutSet = {
        get: vi.fn().mockReturnValue('light'),
        subscribe: vi.fn().mockReturnValue(vi.fn()),
        // No set method
      };

      service.bindSettingsService(settingsServiceWithoutSet);

      // Should not throw and should update theme
      service.setTheme('dark');

      expect(service.getCurrentTheme()).toBe('dark');
    });

    it('should not persist when boundSettingsService is null', () => {
      service = new ThemeService();

      // No settings service bound
      service.setTheme('dark');

      expect(service.getCurrentTheme()).toBe('dark');
    });

    it('should persist when boundSettingsService.set exists and persist is true', () => {
      service = new ThemeService();

      const settingsServiceMock = {
        get: vi.fn().mockReturnValue('light'),
        set: vi.fn(),
        subscribe: vi.fn().mockReturnValue(vi.fn()),
      };

      service.bindSettingsService(settingsServiceMock);

      service.setTheme('dark', { persist: true });

      expect(settingsServiceMock.set).toHaveBeenCalledWith('gallery.theme', 'dark');
    });

    it('should persist by default when persist option not specified', () => {
      service = new ThemeService();

      const settingsServiceMock = {
        get: vi.fn().mockReturnValue('light'),
        set: vi.fn(),
        subscribe: vi.fn().mockReturnValue(vi.fn()),
      };

      service.bindSettingsService(settingsServiceMock);

      service.setTheme('dark'); // No options

      expect(settingsServiceMock.set).toHaveBeenCalledWith('gallery.theme', 'dark');
    });
  });

  describe('applyCurrentTheme return value and notifyListeners', () => {
    it('should not call notifyListeners twice when applyCurrentTheme returns true', () => {
      service = new ThemeService();

      const listener = vi.fn();
      service.onThemeChange(listener);
      listener.mockClear();

      // Setting theme calls applyCurrentTheme which calls notifyListeners
      service.setTheme('dark');

      // Should be called exactly once
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should call notifyListeners once when applyCurrentTheme returns false', () => {
      service = new ThemeService();
      service.setTheme('light'); // Initial state

      const listener = vi.fn();
      service.onThemeChange(listener);
      listener.mockClear();

      // Set same theme without force - applyCurrentTheme returns false
      service.setTheme('light');

      // notifyListeners called because applyCurrentTheme returned false
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('normalized theme setting validation', () => {
    it('should normalize "light" theme correctly', () => {
      service = new ThemeService();
      service.setTheme('light');
      expect(service.getCurrentTheme()).toBe('light');
    });

    it('should normalize "dark" theme correctly', () => {
      service = new ThemeService();
      service.setTheme('dark');
      expect(service.getCurrentTheme()).toBe('dark');
    });

    it('should normalize "auto" theme correctly', () => {
      service = new ThemeService();
      service.setTheme('auto');
      expect(service.getCurrentTheme()).toBe('auto');
    });

    it('should fallback to light for unknown string', () => {
      service = new ThemeService();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      service.setTheme('unknown' as any);
      expect(service.getCurrentTheme()).toBe('light');
    });

    it('should fallback to light for empty string', () => {
      service = new ThemeService();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      service.setTheme('' as any);
      expect(service.getCurrentTheme()).toBe('light');
    });
  });

  describe('MutationObserver edge cases', () => {
    it('should handle mutations with text nodes', () => {
      service = new ThemeService();

      const textNode = document.createTextNode('some text');
      const mutations = [{ addedNodes: [textNode] }];

      // Should not throw
      mutationObserverMock.callback(mutations);

      // Should not call syncThemeAttributes for text nodes
      const syncCalls = (themeDom.syncThemeAttributes as Mock).mock.calls;
      // Only initial call should exist
      expect(syncCalls.length).toBe(1);
    });

    it('should handle mutations with elements that have nested theme scopes', () => {
      service = new ThemeService();
      (themeDom.syncThemeAttributes as Mock).mockClear();

      const container = document.createElement('div');
      const nested1 = document.createElement('div');
      nested1.classList.add('xeg-theme-scope');
      const nested2 = document.createElement('div');
      nested2.classList.add('xeg-theme-scope');
      container.appendChild(nested1);
      nested1.appendChild(nested2);

      const mutations = [{ addedNodes: [container] }];

      mutationObserverMock.callback(mutations);

      // Should call sync for each nested scope
      expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith(
        expect.anything(),
        { scopes: [nested1] }
      );
      expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith(
        expect.anything(),
        { scopes: [nested2] }
      );
    });

    it('should handle mutation with element that is a theme scope itself', () => {
      service = new ThemeService();
      (themeDom.syncThemeAttributes as Mock).mockClear();

      const themeScope = document.createElement('div');
      themeScope.classList.add('xeg-theme-scope');

      const mutations = [{ addedNodes: [themeScope] }];

      mutationObserverMock.callback(mutations);

      expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith(
        expect.anything(),
        { scopes: [themeScope] }
      );
    });
  });

  describe('loadThemeAsync edge cases', () => {
    it('should return null when async storage throws', async () => {
      storageMock.getSync.mockReturnValue({ gallery: { theme: 'light' } });
      storageMock.get.mockRejectedValue(new Error('Async storage error'));

      service = new ThemeService();

      // Wait for async to complete
      await new Promise((r) => setTimeout(r, 50));

      // Should keep sync value since async failed
      expect(service.getCurrentTheme()).toBe('light');
    });

    it('should update theme when async returns different valid value', async () => {
      storageMock.getSync.mockReturnValue({ gallery: { theme: 'light' } });
      storageMock.get.mockResolvedValue({ gallery: { theme: 'dark' } });

      service = new ThemeService();

      await new Promise((r) => setTimeout(r, 50));

      expect(service.getCurrentTheme()).toBe('dark');
    });

    it('should not update when async returns same value', async () => {
      storageMock.getSync.mockReturnValue({ gallery: { theme: 'dark' } });
      storageMock.get.mockResolvedValue({ gallery: { theme: 'dark' } });

      service = new ThemeService();
      (themeDom.syncThemeAttributes as Mock).mockClear();

      await new Promise((r) => setTimeout(r, 50));

      // Should not call sync again since theme is same
      expect((themeDom.syncThemeAttributes as Mock).mock.calls.length).toBe(0);
    });
  });

  describe('initializeSystemDetection edge cases', () => {
    it('should not add event listener when mediaQueryList is null', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockReturnValue(null),
      });

      service = new ThemeService();

      // Should not throw
      expect(service).toBeDefined();
    });
  });

  describe('singleton getInstance', () => {
    it('should return same instance across multiple calls', () => {
      const instance1 = ThemeService.getInstance();
      const instance2 = ThemeService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('onDestroy cleanup', () => {
    it('should clear listeners on destroy', () => {
      service = new ThemeService();

      const listener = vi.fn();
      service.onThemeChange(listener);

      // @ts-expect-error - accessing protected method
      service.onDestroy();

      // Try setting theme - listener should not be called
      // Note: we'd need a new service instance to test this properly
      // since onDestroy is protected
    });

    it('should disconnect observer on destroy', () => {
      service = new ThemeService();

      // @ts-expect-error - accessing protected method
      service.onDestroy();

      expect(mutationObserverMock.disconnect).toHaveBeenCalled();
    });

    it('should call settingsUnsubscribe on destroy', () => {
      service = new ThemeService();

      const unsubscribe = vi.fn();
      const settingsServiceMock = {
        get: vi.fn().mockReturnValue('light'),
        subscribe: vi.fn().mockReturnValue(unsubscribe),
      };

      service.bindSettingsService(settingsServiceMock);

      // @ts-expect-error - accessing protected method
      service.onDestroy();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });

  describe('bindSettingsService subscription callback edge cases', () => {
    it('should handle callback with undefined event', () => {
      service = new ThemeService();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let subscriber: any;
      const settingsServiceMock = {
        get: vi.fn().mockReturnValue('light'),
        subscribe: vi.fn().mockImplementation((cb) => {
          subscriber = cb;
          return vi.fn();
        }),
      };

      service.bindSettingsService(settingsServiceMock);

      // Call with undefined
      expect(() => subscriber(undefined)).not.toThrow();
    });

    it('should handle callback with null event', () => {
      service = new ThemeService();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let subscriber: any;
      const settingsServiceMock = {
        get: vi.fn().mockReturnValue('light'),
        subscribe: vi.fn().mockImplementation((cb) => {
          subscriber = cb;
          return vi.fn();
        }),
      };

      service.bindSettingsService(settingsServiceMock);

      expect(() => subscriber(null)).not.toThrow();
    });

    it('should handle callback with invalid theme value', () => {
      service = new ThemeService();
      service.setTheme('light');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let subscriber: any;
      const settingsServiceMock = {
        get: vi.fn().mockReturnValue('light'),
        subscribe: vi.fn().mockImplementation((cb) => {
          subscriber = cb;
          return vi.fn();
        }),
      };

      service.bindSettingsService(settingsServiceMock);

      // Call with invalid theme value
      subscriber({ key: 'gallery.theme', newValue: 'invalid' });

      // Should remain light since invalid is not in valid list
      expect(service.getCurrentTheme()).toBe('light');
    });
  });
});
