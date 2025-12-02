/**
 * @fileoverview ThemeService Mutation Tests
 *
 * Tests targeting mutation coverage for theme-service.ts
 * Focuses on: loadThemeSync/Async, MutationObserver callbacks, edge cases
 */

import { getPersistentStorage } from '@/shared/services/persistent-storage';
import { ThemeService } from '@/shared/services/theme-service';
import * as themeDom from '@shared/dom/theme';
// Use vitest globals and import only types necessary
import type { Mock } from 'vitest';

// Mock dependencies
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

describe('ThemeService mutation tests', () => {
  let service: ThemeService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let storageMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let matchMediaMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mediaQueryListMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mutationObserverMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let settingsServiceMock: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Storage
    storageMock = {
      getSync: vi.fn().mockReturnValue({ gallery: { theme: 'auto' } }),
      get: vi.fn().mockResolvedValue({ gallery: { theme: 'auto' } }),
    };
    (getPersistentStorage as Mock).mockReturnValue(storageMock);

    // Mock matchMedia
    mediaQueryListMock = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    matchMediaMock = vi.fn().mockReturnValue(mediaQueryListMock);
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });

    // Mock MutationObserver
    mutationObserverMock = {
      observe: vi.fn(),
      disconnect: vi.fn(),
      callback: null as unknown,
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

    // Mock SettingsService
    settingsServiceMock = {
      get: vi.fn(),
      set: vi.fn(),
      subscribe: vi.fn().mockReturnValue(vi.fn()),
    };
  });

  afterEach(() => {
    if (service) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).onDestroy();
    }
  });

  describe('loadThemeSync', () => {
    it('should return auto when storage throws error', () => {
      storageMock.getSync.mockImplementation(() => {
        throw new Error('Storage unavailable');
      });

      service = new ThemeService();

      // Should default to auto when sync storage fails
      expect(service.getCurrentTheme()).toBe('auto');
    });

    it('should return auto when gallery.theme is undefined', () => {
      storageMock.getSync.mockReturnValue({ gallery: {} });

      service = new ThemeService();

      expect(service.getCurrentTheme()).toBe('auto');
    });

    it('should return auto when gallery is undefined', () => {
      storageMock.getSync.mockReturnValue({});

      service = new ThemeService();

      expect(service.getCurrentTheme()).toBe('auto');
    });

    it('should return auto when storage returns null', () => {
      storageMock.getSync.mockReturnValue(null);

      service = new ThemeService();

      expect(service.getCurrentTheme()).toBe('auto');
    });

    it('should correctly load light theme from sync storage', () => {
      storageMock.getSync.mockReturnValue({ gallery: { theme: 'light' } });
      storageMock.get.mockResolvedValue({ gallery: { theme: 'light' } });

      service = new ThemeService();

      expect(service.getCurrentTheme()).toBe('light');
      expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith('light');
    });

    it('should correctly load dark theme from sync storage', () => {
      storageMock.getSync.mockReturnValue({ gallery: { theme: 'dark' } });
      storageMock.get.mockResolvedValue({ gallery: { theme: 'dark' } });

      service = new ThemeService();

      expect(service.getCurrentTheme()).toBe('dark');
      expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith('dark');
    });
  });

  describe('loadThemeAsync', () => {
    it('should return null when async storage throws error', async () => {
      storageMock.getSync.mockReturnValue({ gallery: { theme: 'light' } });
      storageMock.get.mockRejectedValue(new Error('Async storage error'));

      service = new ThemeService();

      await new Promise(process.nextTick);
      await new Promise(process.nextTick);

      // Should keep the sync value when async fails
      expect(service.getCurrentTheme()).toBe('light');
    });

    it('should return null when async storage returns null', async () => {
      storageMock.getSync.mockReturnValue({ gallery: { theme: 'light' } });
      storageMock.get.mockResolvedValue(null);

      service = new ThemeService();

      await new Promise(process.nextTick);
      await new Promise(process.nextTick);

      // Should keep sync value
      expect(service.getCurrentTheme()).toBe('light');
    });

    it('should return null when async storage has no theme', async () => {
      storageMock.getSync.mockReturnValue({ gallery: { theme: 'light' } });
      storageMock.get.mockResolvedValue({ gallery: {} });

      service = new ThemeService();

      await new Promise(process.nextTick);
      await new Promise(process.nextTick);

      expect(service.getCurrentTheme()).toBe('light');
    });

    it('should update theme when async differs from sync', async () => {
      storageMock.getSync.mockReturnValue({ gallery: { theme: 'light' } });
      storageMock.get.mockResolvedValue({ gallery: { theme: 'dark' } });

      service = new ThemeService();

      await new Promise(process.nextTick);
      await new Promise(process.nextTick);

      expect(service.getCurrentTheme()).toBe('dark');
      expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith('dark');
    });

    it('should not update when async value equals sync value', async () => {
      storageMock.getSync.mockReturnValue({ gallery: { theme: 'light' } });
      storageMock.get.mockResolvedValue({ gallery: { theme: 'light' } });

      service = new ThemeService();

      await new Promise(process.nextTick);
      await new Promise(process.nextTick);

      expect(service.getCurrentTheme()).toBe('light');
      // syncThemeAttributes called only once during init
    });
  });

  describe('MutationObserver callbacks', () => {
    it('should handle mutations with nested xeg-theme-scope elements', () => {
      service = new ThemeService();

      const callback = mutationObserverMock.callback;
      expect(callback).toBeDefined();

      // Create a parent element with nested scope elements
      const parentElement = document.createElement('div');
      const nestedScope1 = document.createElement('div');
      nestedScope1.classList.add('xeg-theme-scope');
      const nestedScope2 = document.createElement('div');
      nestedScope2.classList.add('xeg-theme-scope');
      parentElement.appendChild(nestedScope1);
      parentElement.appendChild(nestedScope2);

      const mutations = [
        {
          addedNodes: [parentElement],
        },
      ];

      callback(mutations);

      // Should call syncThemeAttributes for each nested scope
      expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith(expect.anything(), {
        scopes: [nestedScope1],
      });
      expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith(expect.anything(), {
        scopes: [nestedScope2],
      });
    });

    it('should handle mutations with non-Element nodes (Text nodes)', () => {
      service = new ThemeService();

      const callback = mutationObserverMock.callback;

      // Text node
      const textNode = document.createTextNode('Some text');

      const mutations = [
        {
          addedNodes: [textNode],
        },
      ];

      // Should not throw
      expect(() => callback(mutations)).not.toThrow();
    });

    it('should handle mutations with Comment nodes', () => {
      service = new ThemeService();

      const callback = mutationObserverMock.callback;

      const commentNode = document.createComment('Comment');

      const mutations = [
        {
          addedNodes: [commentNode],
        },
      ];

      expect(() => callback(mutations)).not.toThrow();
    });

    it('should handle empty addedNodes array', () => {
      service = new ThemeService();

      const callback = mutationObserverMock.callback;

      const mutations = [
        {
          addedNodes: [],
        },
      ];

      expect(() => callback(mutations)).not.toThrow();
    });

    it('should handle element without xeg-theme-scope class', () => {
      service = new ThemeService();

      const callback = mutationObserverMock.callback;

      const regularElement = document.createElement('div');
      regularElement.classList.add('some-other-class');

      const mutations = [
        {
          addedNodes: [regularElement],
        },
      ];

      // Call count before
      const callCountBefore = (themeDom.syncThemeAttributes as Mock).mock.calls.length;

      callback(mutations);

      // Should not have additional calls for non-scope elements
      const callCountAfter = (themeDom.syncThemeAttributes as Mock).mock.calls.length;
      expect(callCountAfter).toBe(callCountBefore);
    });
  });

  describe('setTheme', () => {
    it('should normalize invalid theme to light', () => {
      service = new ThemeService();
      service.bindSettingsService(settingsServiceMock);

      service.setTheme('invalid-theme');

      expect(service.getCurrentTheme()).toBe('light');
    });

    it('should not persist when persist option is false', () => {
      service = new ThemeService();
      service.bindSettingsService(settingsServiceMock);

      service.setTheme('dark', { persist: false });

      expect(settingsServiceMock.set).not.toHaveBeenCalled();
      expect(service.getCurrentTheme()).toBe('dark');
    });

    it('should force update with force option', () => {
      storageMock.getSync.mockReturnValue({ gallery: { theme: 'dark' } });
      storageMock.get.mockResolvedValue({ gallery: { theme: 'dark' } });

      service = new ThemeService();
      vi.clearAllMocks();

      service.setTheme('dark', { force: true });

      expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith('dark');
    });

    it('should notify listeners when theme changes', () => {
      service = new ThemeService();
      const listener = vi.fn();
      service.onThemeChange(listener);

      service.setTheme('dark');

      expect(listener).toHaveBeenCalledWith('dark', 'dark');
    });

    it('should still notify when applyCurrentTheme returns false', () => {
      storageMock.getSync.mockReturnValue({ gallery: { theme: 'dark' } });
      storageMock.get.mockResolvedValue({ gallery: { theme: 'dark' } });

      service = new ThemeService();
      const listener = vi.fn();
      service.onThemeChange(listener);
      vi.clearAllMocks();

      // Set to same theme without force - applyCurrentTheme returns false
      service.setTheme('dark');

      // Should still notify via the fallback notification
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('getEffectiveTheme', () => {
    it('should return dark when auto and system prefers dark', () => {
      mediaQueryListMock.matches = true;
      storageMock.getSync.mockReturnValue({ gallery: { theme: 'auto' } });
      storageMock.get.mockResolvedValue({ gallery: { theme: 'auto' } });

      service = new ThemeService();

      expect(service.getEffectiveTheme()).toBe('dark');
    });

    it('should return light when auto and system prefers light', () => {
      mediaQueryListMock.matches = false;
      storageMock.getSync.mockReturnValue({ gallery: { theme: 'auto' } });
      storageMock.get.mockResolvedValue({ gallery: { theme: 'auto' } });

      service = new ThemeService();

      expect(service.getEffectiveTheme()).toBe('light');
    });

    it('should return setting value when not auto', () => {
      service = new ThemeService();

      service.setTheme('dark');
      expect(service.getEffectiveTheme()).toBe('dark');

      service.setTheme('light');
      expect(service.getEffectiveTheme()).toBe('light');
    });
  });

  describe('bindSettingsService', () => {
    it('should not bind null settings service', () => {
      service = new ThemeService();

      // Should not throw
      service.bindSettingsService(null as unknown as typeof settingsServiceMock);

      expect(settingsServiceMock.get).not.toHaveBeenCalled();
    });

    it('should not rebind same settings service', () => {
      service = new ThemeService();

      service.bindSettingsService(settingsServiceMock);
      const firstSubscribeCount = settingsServiceMock.subscribe.mock.calls.length;

      service.bindSettingsService(settingsServiceMock);
      const secondSubscribeCount = settingsServiceMock.subscribe.mock.calls.length;

      expect(secondSubscribeCount).toBe(firstSubscribeCount);
    });

    it('should unsubscribe from previous settings service', () => {
      service = new ThemeService();
      const unsubscribe = vi.fn();
      settingsServiceMock.subscribe.mockReturnValue(unsubscribe);

      service.bindSettingsService(settingsServiceMock);

      // Create new settings service
      const newSettingsService = {
        get: vi.fn(),
        set: vi.fn(),
        subscribe: vi.fn().mockReturnValue(vi.fn()),
      };

      service.bindSettingsService(newSettingsService);

      expect(unsubscribe).toHaveBeenCalled();
    });

    it('should ignore invalid theme from settings', () => {
      service = new ThemeService();
      settingsServiceMock.get.mockReturnValue('invalid');

      service.bindSettingsService(settingsServiceMock);

      // Should keep default auto
      expect(service.getCurrentTheme()).toBe('auto');
    });

    it('should handle settings service without subscribe method', () => {
      service = new ThemeService();
      const settingsWithoutSubscribe = {
        get: vi.fn().mockReturnValue('dark'),
        set: vi.fn(),
        subscribe: undefined,
      };

      // Should not throw
      expect(() => {
        service.bindSettingsService(settingsWithoutSubscribe as unknown as typeof settingsServiceMock);
      }).not.toThrow();

      expect(service.getCurrentTheme()).toBe('dark');
    });

    it('should sync theme from settings if different', () => {
      storageMock.getSync.mockReturnValue({ gallery: { theme: 'light' } });
      service = new ThemeService();

      settingsServiceMock.get.mockReturnValue('dark');
      service.bindSettingsService(settingsServiceMock);

      expect(service.getCurrentTheme()).toBe('dark');
    });

    it('should not update if settings theme equals current', () => {
      storageMock.getSync.mockReturnValue({ gallery: { theme: 'dark' } });
      storageMock.get.mockResolvedValue({ gallery: { theme: 'dark' } });
      service = new ThemeService();

      settingsServiceMock.get.mockReturnValue('dark');
      vi.clearAllMocks();

      service.bindSettingsService(settingsServiceMock);

      // syncThemeAttributes should not be called again
      expect(themeDom.syncThemeAttributes).not.toHaveBeenCalled();
    });
  });

  describe('settings change subscription', () => {
    it('should ignore settings change for non-theme keys', () => {
      service = new ThemeService();
      service.bindSettingsService(settingsServiceMock);

      const callback = settingsServiceMock.subscribe.mock.calls[0][0];
      vi.clearAllMocks();

      callback({ key: 'gallery.otherSetting', newValue: 'value' });

      expect(themeDom.syncThemeAttributes).not.toHaveBeenCalled();
    });

    it('should ignore settings change when new value equals current', () => {
      storageMock.getSync.mockReturnValue({ gallery: { theme: 'dark' } });
      storageMock.get.mockResolvedValue({ gallery: { theme: 'dark' } });
      service = new ThemeService();
      service.bindSettingsService(settingsServiceMock);

      const callback = settingsServiceMock.subscribe.mock.calls[0][0];
      vi.clearAllMocks();

      callback({ key: 'gallery.theme', newValue: 'dark' });

      expect(themeDom.syncThemeAttributes).not.toHaveBeenCalled();
    });
  });

  describe('onThemeChange', () => {
    it('should allow multiple listeners', () => {
      service = new ThemeService();
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      service.onThemeChange(listener1);
      service.onThemeChange(listener2);

      service.setTheme('dark');

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should allow unsubscribing specific listener', () => {
      service = new ThemeService();
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      const unsubscribe1 = service.onThemeChange(listener1);
      service.onThemeChange(listener2);

      unsubscribe1();

      service.setTheme('dark');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('onDestroy', () => {
    it('should disconnect MutationObserver', () => {
      service = new ThemeService();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).onDestroy();

      expect(mutationObserverMock.disconnect).toHaveBeenCalled();
    });

    it('should clear listeners', () => {
      service = new ThemeService();
      const listener = vi.fn();
      service.onThemeChange(listener);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).onDestroy();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((service as any).listeners.size).toBe(0);
    });

    it('should call settings unsubscribe if bound', () => {
      service = new ThemeService();
      const unsubscribe = vi.fn();
      settingsServiceMock.subscribe.mockReturnValue(unsubscribe);

      service.bindSettingsService(settingsServiceMock);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).onDestroy();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });
});
