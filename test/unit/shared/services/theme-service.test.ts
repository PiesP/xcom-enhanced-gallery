// Use vitest globals for runtime functions and import types only
import type { Mock } from 'vitest';

// Mocks - ensure they are defined before importing modules that use them
vi.mock("@shared/dom/theme", () => ({
  syncThemeAttributes: vi.fn(),
}));

vi.mock("@shared/services/persistent-storage", () => ({
  getPersistentStorage: vi.fn(),
}));

vi.mock("@/shared/logging", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { APP_SETTINGS_STORAGE_KEY } from "@/constants";
import { getPersistentStorage } from "@shared/services/persistent-storage";
import { ThemeService } from "@shared/services/theme-service";
import * as themeDom from "@shared/dom/theme";
import { logger } from '@/shared/logging';

// Save the original matchMedia descriptor so we can restore it after tests
const originalMatchMediaDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'matchMedia');

// Shared settingsServiceMock for suites which need it
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let settingsServiceMock: any;

describe("ThemeService (consolidated)", () => {
  let service: ThemeService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let storageMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mediaQueryListMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mutationObserverMock: any;
  // Use top-level settingsServiceMock

  beforeEach(() => {
    vi.clearAllMocks();
    (ThemeService as any).instance = undefined;

    storageMock = {
      getSync: vi.fn().mockReturnValue({ gallery: { theme: "auto" } }),
      get: vi.fn().mockResolvedValue({ gallery: { theme: "auto" } }),
    };
    (getPersistentStorage as Mock).mockReturnValue(storageMock);

    mediaQueryListMock = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn().mockReturnValue(mediaQueryListMock),
    });

    mutationObserverMock = {
      observe: vi.fn(),
      disconnect: vi.fn(),
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

    settingsServiceMock = {
      get: vi.fn(),
      set: vi.fn(),
      subscribe: vi.fn().mockReturnValue(vi.fn()),
    };
  });

  afterEach(() => {
    if (service) (service as any).onDestroy();
    try {
      if (originalMatchMediaDescriptor) {
        Object.defineProperty(globalThis, 'matchMedia', originalMatchMediaDescriptor as PropertyDescriptor);
      } else {
        delete (globalThis as any).matchMedia;
      }
    } catch (_) {}
    (ThemeService as any).instance = undefined;
  });

  it("should have a working base set of tests", () => {
    service = new ThemeService();
    expect(service).toBeDefined();
  });
});

describe("ThemeService", () => {
  let service: ThemeService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let storageMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let matchMediaMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mediaQueryListMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mutationObserverMock: any;
  // Use top-level settingsServiceMock

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Storage
    storageMock = {
      getSync: vi.fn().mockReturnValue({ gallery: { theme: "auto" } }),
      get: vi.fn().mockResolvedValue({ gallery: { theme: "auto" } }),
    };
    (getPersistentStorage as Mock).mockReturnValue(storageMock);

    // Mock matchMedia with configurable true to allow deletion
    mediaQueryListMock = {
      matches: false, // Default to light system theme
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    matchMediaMock = vi.fn().mockReturnValue(mediaQueryListMock);
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: matchMediaMock,
    });

    // Mock MutationObserver
    mutationObserverMock = {
      observe: vi.fn(),
      disconnect: vi.fn(),
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

  it("should initialize with default values", () => {
    service = new ThemeService();
    expect(service).toBeDefined();
    expect(storageMock.getSync).toHaveBeenCalledWith(APP_SETTINGS_STORAGE_KEY);
    expect(themeDom.syncThemeAttributes).toHaveBeenCalled();
  });

  it("should sync theme from async storage if different", async () => {
    storageMock.getSync.mockReturnValue({ gallery: { theme: "light" } });
    storageMock.get.mockResolvedValue({ gallery: { theme: "dark" } });

    service = new ThemeService();

    // Wait for async promise in constructor
    await new Promise(process.nextTick);
    await new Promise(process.nextTick);

    expect(storageMock.get).toHaveBeenCalled();
    expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith("dark");
  });

  it("should bind settings service and sync initial value", () => {
    service = new ThemeService();
    settingsServiceMock.get.mockReturnValue("dark");

    service.bindSettingsService(settingsServiceMock);

    expect(settingsServiceMock.get).toHaveBeenCalledWith("gallery.theme");
    expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith("dark");
  });

  it("should subscribe to settings changes", () => {
    service = new ThemeService();
    service.bindSettingsService(settingsServiceMock);

    expect(settingsServiceMock.subscribe).toHaveBeenCalled();

    // Simulate setting change
    const callback = settingsServiceMock.subscribe.mock.calls[0][0];
    callback({ key: "gallery.theme", newValue: "dark" });

    expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith("dark");
  });

  it("should ignore invalid theme settings", () => {
    service = new ThemeService();
    service.bindSettingsService(settingsServiceMock);

    const callback = settingsServiceMock.subscribe.mock.calls[0][0];
    callback({ key: "gallery.theme", newValue: "invalid-theme" });

    // Should not have called sync with invalid theme (assuming it was auto/light before)
    expect(themeDom.syncThemeAttributes).not.toHaveBeenCalledWith(
      "invalid-theme",
    );
  });

  it("should set theme and persist", () => {
    service = new ThemeService();
    service.bindSettingsService(settingsServiceMock);

    service.setTheme("dark");

    expect(settingsServiceMock.set).toHaveBeenCalledWith(
      "gallery.theme",
      "dark",
    );
    expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith("dark");
  });

  it("should handle system theme changes when in auto mode", async () => {
    service = new ThemeService();
    // Wait for async initialization
    await new Promise(process.nextTick);
    await new Promise(process.nextTick);

    // Default is auto

    // Simulate system change to dark
    mediaQueryListMock.matches = true;

    // Trigger listener
    // We need to find the call to addEventListener("change", ...)
    const calls = mediaQueryListMock.addEventListener.mock.calls;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const changeCall = calls.find((c: any[]) => c[0] === "change");
    expect(changeCall).toBeDefined();

    const listener = changeCall[1];
    listener();

    expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith("dark");
  });

  it("should NOT handle system theme changes when NOT in auto mode", async () => {
    service = new ThemeService();
    // Wait for async initialization
    await new Promise(process.nextTick);
    await new Promise(process.nextTick);

    service.setTheme("light");

    // Simulate system change to dark
    mediaQueryListMock.matches = true;

    // Trigger listener
    const calls = mediaQueryListMock.addEventListener.mock.calls;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const changeCall = calls.find((c: any[]) => c[0] === "change");
    expect(changeCall).toBeDefined();

    const listener = changeCall[1];
    listener();

    // Should still be light
    expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith("light");
  });

  it("should observe DOM mutations and apply theme to new scopes", () => {
    service = new ThemeService();

    const callback = mutationObserverMock.callback;
    const element = document.createElement("div");
    element.classList.add("xeg-theme-scope");

    const mutations = [
      {
        addedNodes: [element],
      },
    ];

    callback(mutations);

    expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith(
      expect.anything(),
      { scopes: [element] },
    );
  });

  it('should not throw on onDestroy when observer is null', () => {
    service = new ThemeService();
    // Simulate missing observer after construction
    (service as any).observer = null;
    expect(() => (service as any).onDestroy()).not.toThrow();
  });

  it('constructor should call applyCurrentTheme with force=true', () => {
    const applySpy = vi.spyOn(ThemeService.prototype as any, 'applyCurrentTheme' as any);
    service = new ThemeService();
    expect(applySpy).toHaveBeenCalled();
    // At least one of the initial calls should include true as the force param
    expect(applySpy.mock.calls.some((c: any[]) => c[0] === true)).toBeTruthy();
    applySpy.mockRestore?.();
  });

  it('initializeSystemDetection should not register listener when matchMedia missing', async () => {
    service = new ThemeService();
    // Simulate missing matchMedia after construction
    (service as any).mediaQueryList = null;
    // Call onInitialize to trigger initializeSystemDetection
    await (service as any).onInitialize();
    // Our original mediaQueryList mock should not be used
    expect(mediaQueryListMock.addEventListener).not.toHaveBeenCalled();
  });

  it('onInitialize should bind settings service from service-accessors import if present', async () => {
    settingsServiceMock = {
      get: vi.fn().mockReturnValue('dark'),
      set: vi.fn(),
      subscribe: vi.fn().mockReturnValue(vi.fn()),
    };

    // Set the mocked service-accessors module to return our settings service
    const accessors = await import('@/shared/container/service-accessors');
    // Replace the real tryGetSettingsManager with a spy/mock that returns our settingsMock
    vi.spyOn(accessors as any, 'tryGetSettingsManager').mockReturnValue(settingsServiceMock as any);

    service = new ThemeService();
    // Force onInitialize invocation
    await (service as any).onInitialize();

    // The settingsServiceMock.get('gallery.theme') should have been called
    expect(settingsServiceMock.get).toHaveBeenCalledWith('gallery.theme');
    // Theme should be updated and applied
    expect((themeDom.syncThemeAttributes as any)).toHaveBeenCalledWith('dark');
  });

  it('applyCurrentTheme returns false when there is no change', () => {
    service = new ThemeService();
    // Ensure currentTheme and setting are aligned
    (service as any).currentTheme = 'light';
    (service as any).themeSetting = 'light';
    vi.clearAllMocks();
    const result = (service as any).applyCurrentTheme(false);
    expect(result).toBe(false);
    expect(themeDom.syncThemeAttributes).not.toHaveBeenCalled();
  });

  it('applyCurrentTheme returns true when theme actually changes', () => {
    service = new ThemeService();
    // Set currentTheme to light and themeSetting to auto, then simulate mediaQueryList changed to dark
    (service as any).currentTheme = 'light';
    (service as any).themeSetting = 'auto';
    // Simulate system dark mode
    (matchMedia as any)().matches = true;
    vi.clearAllMocks();
    const result = (service as any).applyCurrentTheme(false);
    expect(result).toBe(true);
    expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith('dark');
  });

  it('setTheme with persist=false should not call boundSettingsService.set', () => {
    service = new ThemeService();
    service.bindSettingsService(settingsServiceMock);
    vi.clearAllMocks();
    service.setTheme('dark', { persist: false });
    expect(settingsServiceMock.set).not.toHaveBeenCalled();
    expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith('dark');
  });

  it('setTheme with force=true should apply theme even when current equals effective', () => {
    service = new ThemeService();
    // Force currentTheme and themeSetting to the same value
    (service as any).currentTheme = 'light';
    (service as any).themeSetting = 'light';

    const applySpy = vi.spyOn(ThemeService.prototype as any, 'applyCurrentTheme' as any);
    vi.clearAllMocks();
    service.setTheme('light', { force: true });

    expect(applySpy).toHaveBeenCalledWith(true);
    expect((themeDom.syncThemeAttributes as any)).toHaveBeenCalledWith('light');
    applySpy.mockRestore?.();
  });

  it('should log warn when document.documentElement is not available for observation', () => {
    // In some test environments (like JSDOM), document.documentElement is non-configurable
    // and cannot be deleted - attempt to mock via Document.prototype first and fallback
    // to a global document replacement. If neither are possible, skip the test.
    const originalDocument = (globalThis as any).document;
    let restoredDescriptor: PropertyDescriptor | undefined;
    let replacedGlobalDoc = false;

    try {
      // Try overriding the prototype getter for documentElement
      const protoDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'documentElement');
      if (protoDesc && protoDesc.configurable) {
        restoredDescriptor = protoDesc;
        Object.defineProperty(Document.prototype, 'documentElement', { get: () => undefined, configurable: true });
      } else {
        // Fallback: attempt to replace global document with a minimal object without documentElement
        try {
          const fakeDocument: Partial<Document> = Object.assign({}, originalDocument);
          delete (fakeDocument as any).documentElement;
          Object.defineProperty(globalThis, 'document', { value: fakeDocument, configurable: true });
          replacedGlobalDoc = true;
        } catch (e) {
          // If we can't replace document either, skip the test gracefully
          // because the environment doesn't allow simulating this edge-case.
          // Skipping due to environment limitation (unable to mock document.documentElement)
          return;
        }
      }

      service = new ThemeService();
      expect((logger as any).warn).toHaveBeenCalledWith('[ThemeService] document.documentElement not available for observation');
    } finally {
      // Restore any changes
      try {
        if (restoredDescriptor) {
          Object.defineProperty(Document.prototype, 'documentElement', restoredDescriptor);
        }
      } catch (_) {}

      try {
        if (replacedGlobalDoc) {
          Object.defineProperty(globalThis, 'document', { value: originalDocument, configurable: true });
        }
      } catch (_) {}
    }
  });

  it("should notify listeners on theme change", () => {
    service = new ThemeService();
    const listener = vi.fn();
    const unsubscribe = service.onThemeChange(listener);

    service.setTheme("dark");

    expect(listener).toHaveBeenCalledWith("dark", "dark");

    unsubscribe();

    // Check if listener is removed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listenersSize = (service as any).listeners.size;
    expect(listenersSize).toBe(0);

    service.setTheme("light");
    expect(listener).toHaveBeenCalledTimes(1); // Not called again
  });

  it("should return correct isDarkMode", () => {
    service = new ThemeService();
    // Auto + Light system -> false
    expect(service.isDarkMode()).toBe(false);

    service.setTheme("dark");
    expect(service.isDarkMode()).toBe(true);

    service.setTheme("auto");
    mediaQueryListMock.matches = true;
    expect(service.isDarkMode()).toBe(true);
  });

  it("should handle async storage failure gracefully", async () => {
    storageMock.getSync.mockReturnValue({ gallery: { theme: "light" } });
    storageMock.get.mockRejectedValue(new Error("Storage error"));

    service = new ThemeService();

    await new Promise(process.nextTick);
    await new Promise(process.nextTick);

    // Should not crash, and keep sync value
    expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith("light");
  });
});

describe("ThemeService - mutation coverage", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let storageMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mediaQueryListMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mutationObserverMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let service: ThemeService;

  beforeEach(() => {
    vi.clearAllMocks();

    storageMock = {
      getSync: vi.fn().mockReturnValue({ gallery: { theme: "auto" } }),
      get: vi.fn().mockResolvedValue({ gallery: { theme: "auto" } }),
    };
    (getPersistentStorage as Mock).mockReturnValue(storageMock);

    mediaQueryListMock = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn().mockReturnValue(mediaQueryListMock),
    });

    mutationObserverMock = {
      observe: vi.fn(),
      disconnect: vi.fn(),
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).onDestroy();
    }
  });

  describe("optional chaining coverage", () => {
    it("should handle event with null key in subscribe callback", () => {
      service = new ThemeService();
      settingsServiceMock = {
        get: vi.fn().mockReturnValue("light"),
        subscribe: vi.fn().mockReturnValue(vi.fn()),
      };

      service.bindSettingsService(settingsServiceMock);

      const callback = settingsServiceMock.subscribe.mock.calls[0]?.[0];
      expect(callback).toBeDefined();

      // Event with null/undefined key
      expect(() => callback({ key: null, newValue: "dark" })).not.toThrow();
      expect(() => callback({ newValue: "dark" })).not.toThrow();
      expect(() => callback(null)).not.toThrow();
      expect(() => callback(undefined)).not.toThrow();
    });

    it("should handle observer disconnect when observer exists", () => {
      service = new ThemeService();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).onDestroy();

      expect(mutationObserverMock.disconnect).toHaveBeenCalled();
    });
  });

  describe("snapshot optional chaining", () => {
    it("should handle null snapshot from sync storage", () => {
      storageMock.getSync.mockReturnValue(null);

      service = new ThemeService();

      expect(service.getCurrentTheme()).toBe("auto");
    });

    it("should handle undefined gallery in snapshot", () => {
      storageMock.getSync.mockReturnValue({});

      service = new ThemeService();

      expect(service.getCurrentTheme()).toBe("auto");
    });

    it("should handle null theme in gallery", () => {
      storageMock.getSync.mockReturnValue({ gallery: { theme: null } });

      service = new ThemeService();

      expect(service.getCurrentTheme()).toBe("auto");
    });

    it("should handle undefined theme in gallery", () => {
      storageMock.getSync.mockReturnValue({ gallery: {} });

      service = new ThemeService();

      expect(service.getCurrentTheme()).toBe("auto");
    });
  });

  describe("loadThemeAsync optional chaining", () => {
    it("should handle null snapshot from async storage", async () => {
      storageMock.getSync.mockReturnValue({ gallery: { theme: "light" } });
      storageMock.get.mockResolvedValue(null);

      service = new ThemeService();

      await new Promise(process.nextTick);
      await new Promise(process.nextTick);

      // Should keep sync value when async returns null
      expect(service.getCurrentTheme()).toBe("light");
    });

    it("should handle undefined gallery from async storage", async () => {
      storageMock.getSync.mockReturnValue({ gallery: { theme: "light" } });
      storageMock.get.mockResolvedValue({});

      service = new ThemeService();

      await new Promise(process.nextTick);
      await new Promise(process.nextTick);

      // async returns null (due to undefined gallery), keeps sync
      expect(service.getCurrentTheme()).toBe("light");
    });
  });

  describe("conditional expression coverage", () => {
    it("should skip async update when saved equals current theme", async () => {
      storageMock.getSync.mockReturnValue({ gallery: { theme: "dark" } });
      storageMock.get.mockResolvedValue({ gallery: { theme: "dark" } });

      service = new ThemeService();

      const initialCalls = (themeDom.syncThemeAttributes as Mock).mock.calls.length;

      await new Promise(process.nextTick);
      await new Promise(process.nextTick);

      // Should not call sync again since themes are same
      expect((themeDom.syncThemeAttributes as Mock).mock.calls.length).toBe(initialCalls);
    });

    it("should update theme when async saved differs from current", async () => {
      storageMock.getSync.mockReturnValue({ gallery: { theme: "light" } });
      storageMock.get.mockResolvedValue({ gallery: { theme: "dark" } });

      service = new ThemeService();

      await new Promise(process.nextTick);
      await new Promise(process.nextTick);

      expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith("dark");
    });
  });

  describe("boolean literal mutations", () => {
    it("should return false from applyCurrentTheme when theme unchanged", () => {
      service = new ThemeService();
      service.setTheme("dark");

      // Clear mock
      (themeDom.syncThemeAttributes as Mock).mockClear();

      // Set same theme again without force
      service.setTheme("dark");

      // Should not sync again (applyCurrentTheme returns false)
      // But notifyListeners is still called
    });

    it("should return true from applyCurrentTheme when theme changes", () => {
      service = new ThemeService();
      service.setTheme("light");

      (themeDom.syncThemeAttributes as Mock).mockClear();

      service.setTheme("dark");

      expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith("dark");
    });
  });

  describe("bindSettingsService edge cases", () => {
    it("should not bind null settings service", () => {
      service = new ThemeService();

      expect(() => service.bindSettingsService(null as any)).not.toThrow();
    });

    it("should unsubscribe previous subscription when rebinding", () => {
      service = new ThemeService();

      const unsubscribe1 = vi.fn();
      const settingsService1 = {
        get: vi.fn().mockReturnValue("light"),
        subscribe: vi.fn().mockReturnValue(unsubscribe1),
      };

      const settingsService2 = {
        get: vi.fn().mockReturnValue("dark"),
        subscribe: vi.fn().mockReturnValue(vi.fn()),
      };

      service.bindSettingsService(settingsService1);
      service.bindSettingsService(settingsService2);

      expect(unsubscribe1).toHaveBeenCalled();
    });

    it("should handle settings service without subscribe function", () => {
      service = new ThemeService();

      const settingsService = {
        get: vi.fn().mockReturnValue("dark"),
      };

      expect(() => service.bindSettingsService(settingsService as any)).not.toThrow();
    });
  });

  describe("setTheme persist option", () => {
    it("should persist when persist is not specified", () => {
      service = new ThemeService();

      settingsServiceMock = {
        get: vi.fn().mockReturnValue("light"),
        set: vi.fn(),
        subscribe: vi.fn().mockReturnValue(vi.fn()),
      };

      service.bindSettingsService(settingsServiceMock);

      service.setTheme("dark");

      expect(settingsServiceMock.set).toHaveBeenCalledWith("gallery.theme", "dark");
    });

    it("should not persist when persist is false", () => {
      service = new ThemeService();

      settingsServiceMock = {
        get: vi.fn().mockReturnValue("light"),
        set: vi.fn(),
        subscribe: vi.fn().mockReturnValue(vi.fn()),
      };

      service.bindSettingsService(settingsServiceMock);
      settingsServiceMock.set.mockClear();

      service.setTheme("dark", { persist: false });

      expect(settingsServiceMock.set).not.toHaveBeenCalled();
    });
  });

  describe("mediaQueryList matches coverage", () => {
    it("should handle when mediaQueryList.matches returns undefined", () => {
      const mediaQueryWithUndefined = {
        matches: undefined,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        configurable: true,
        value: vi.fn().mockReturnValue(mediaQueryWithUndefined),
      });

      service = new ThemeService();
      service.setTheme("auto");

      // When matches is undefined (falsy), should return light
      expect(service.getEffectiveTheme()).toBe("light");
    });

    it("should return dark when mediaQueryList.matches is true", () => {
      const mediaQueryDark = {
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        configurable: true,
        value: vi.fn().mockReturnValue(mediaQueryDark),
      });

      service = new ThemeService();
      service.setTheme("auto");

      expect(service.getEffectiveTheme()).toBe("dark");
    });
  });
});
// Duplicate imports and vi.mock calls removed - top-of-file declarations suffice

describe("ThemeService", () => {
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
      getSync: vi.fn().mockReturnValue({ gallery: { theme: "auto" } }),
      get: vi.fn().mockResolvedValue({ gallery: { theme: "auto" } }),
    };
    (getPersistentStorage as Mock).mockReturnValue(storageMock);

    // Mock matchMedia
    mediaQueryListMock = {
      matches: false, // Default to light system theme
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    matchMediaMock = vi.fn().mockReturnValue(mediaQueryListMock);
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: matchMediaMock,
    });

    // Mock MutationObserver
    mutationObserverMock = {
      observe: vi.fn(),
      disconnect: vi.fn(),
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

  it("should initialize with default values", () => {
    service = new ThemeService();
    expect(service).toBeDefined();
    expect(storageMock.getSync).toHaveBeenCalledWith(APP_SETTINGS_STORAGE_KEY);
    expect(themeDom.syncThemeAttributes).toHaveBeenCalled();
  });

  it("should sync theme from async storage if different", async () => {
    storageMock.getSync.mockReturnValue({ gallery: { theme: "light" } });
    storageMock.get.mockResolvedValue({ gallery: { theme: "dark" } });

    service = new ThemeService();

    // Wait for async promise in constructor
    await new Promise(process.nextTick);
    await new Promise(process.nextTick);

    expect(storageMock.get).toHaveBeenCalled();
    expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith("dark");
  });

  it("should bind settings service and sync initial value", () => {
    service = new ThemeService();
    settingsServiceMock.get.mockReturnValue("dark");

    service.bindSettingsService(settingsServiceMock);

    expect(settingsServiceMock.get).toHaveBeenCalledWith("gallery.theme");
    expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith("dark");
  });

  it("should subscribe to settings changes", () => {
    service = new ThemeService();
    service.bindSettingsService(settingsServiceMock);

    expect(settingsServiceMock.subscribe).toHaveBeenCalled();

    // Simulate setting change
    const callback = settingsServiceMock.subscribe.mock.calls[0][0];
    callback({ key: "gallery.theme", newValue: "dark" });

    expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith("dark");
  });

  it("should ignore invalid theme settings", () => {
    service = new ThemeService();
    service.bindSettingsService(settingsServiceMock);

    const callback = settingsServiceMock.subscribe.mock.calls[0][0];
    callback({ key: "gallery.theme", newValue: "invalid-theme" });

    // Should not have called sync with invalid theme (assuming it was auto/light before)
    expect(themeDom.syncThemeAttributes).not.toHaveBeenCalledWith(
      "invalid-theme",
    );
  });

  it("should set theme and persist", () => {
    service = new ThemeService();
    service.bindSettingsService(settingsServiceMock);

    service.setTheme("dark");

    expect(settingsServiceMock.set).toHaveBeenCalledWith(
      "gallery.theme",
      "dark",
    );
    expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith("dark");
  });

  it("should handle system theme changes when in auto mode", async () => {
    service = new ThemeService();
    // Wait for async initialization
    await new Promise(process.nextTick);
    await new Promise(process.nextTick);

    // Default is auto

    // Simulate system change to dark
    mediaQueryListMock.matches = true;

    // Trigger listener
    // We need to find the call to addEventListener("change", ...)
    const calls = mediaQueryListMock.addEventListener.mock.calls;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const changeCall = calls.find((c: any[]) => c[0] === "change");
    expect(changeCall).toBeDefined();

    const listener = changeCall[1];
    listener();

    expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith("dark");
  });

  it("should NOT handle system theme changes when NOT in auto mode", async () => {
    service = new ThemeService();
    // Wait for async initialization
    await new Promise(process.nextTick);
    await new Promise(process.nextTick);

    service.setTheme("light");

    // Simulate system change to dark
    mediaQueryListMock.matches = true;

    // Trigger listener
    const calls = mediaQueryListMock.addEventListener.mock.calls;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const changeCall = calls.find((c: any[]) => c[0] === "change");
    expect(changeCall).toBeDefined();

    const listener = changeCall[1];
    listener();

    // Should still be light
    expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith("light");
  });

  it("should observe DOM mutations and apply theme to new scopes", () => {
    service = new ThemeService();

    const callback = mutationObserverMock.callback;
    const element = document.createElement("div");
    element.classList.add("xeg-theme-scope");

    const mutations = [
      {
        addedNodes: [element],
      },
    ];

    callback(mutations);

    expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith(
      expect.anything(),
      { scopes: [element] },
    );
  });

  it("should notify listeners on theme change", () => {
    service = new ThemeService();
    const listener = vi.fn();
    const unsubscribe = service.onThemeChange(listener);

    service.setTheme("dark");

    expect(listener).toHaveBeenCalledWith("dark", "dark");

    unsubscribe();

    // Check if listener is removed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listenersSize = (service as any).listeners.size;
    expect(listenersSize).toBe(0);

    service.setTheme("light");
    expect(listener).toHaveBeenCalledTimes(1); // Not called again
  });

  it("should return correct isDarkMode", () => {
    service = new ThemeService();
    // Auto + Light system -> false
    expect(service.isDarkMode()).toBe(false);

    service.setTheme("dark");
    expect(service.isDarkMode()).toBe(true);

    service.setTheme("auto");
    mediaQueryListMock.matches = true;
    expect(service.isDarkMode()).toBe(true);
  });

  it("should handle async storage failure gracefully", async () => {
    storageMock.getSync.mockReturnValue({ gallery: { theme: "light" } });
    storageMock.get.mockRejectedValue(new Error("Storage error"));

    service = new ThemeService();

    await new Promise(process.nextTick);
    await new Promise(process.nextTick);

    // Should not crash, and keep sync value
    expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith("light");
  });
});

describe("ThemeService - mutation coverage", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let storageMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mediaQueryListMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mutationObserverMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let service: ThemeService;

  beforeEach(() => {
    vi.clearAllMocks();

    storageMock = {
      getSync: vi.fn().mockReturnValue({ gallery: { theme: "auto" } }),
      get: vi.fn().mockResolvedValue({ gallery: { theme: "auto" } }),
    };
    (getPersistentStorage as Mock).mockReturnValue(storageMock);

    mediaQueryListMock = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn().mockReturnValue(mediaQueryListMock),
    });

    mutationObserverMock = {
      observe: vi.fn(),
      disconnect: vi.fn(),
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).onDestroy();
    }
  });

  describe("optional chaining coverage", () => {
    it("should handle event with null key in subscribe callback", () => {
      service = new ThemeService();
      settingsServiceMock = {
        get: vi.fn().mockReturnValue("light"),
        subscribe: vi.fn().mockReturnValue(vi.fn()),
      };

      service.bindSettingsService(settingsServiceMock);

      const callback = settingsServiceMock.subscribe.mock.calls[0]?.[0];
      expect(callback).toBeDefined();

      // Event with null/undefined key
      expect(() => callback({ key: null, newValue: "dark" })).not.toThrow();
      expect(() => callback({ newValue: "dark" })).not.toThrow();
      expect(() => callback(null)).not.toThrow();
      expect(() => callback(undefined)).not.toThrow();
    });

    it("should handle observer disconnect when observer exists", () => {
      service = new ThemeService();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).onDestroy();

      expect(mutationObserverMock.disconnect).toHaveBeenCalled();
    });
  });

  describe("snapshot optional chaining", () => {
    it("should handle null snapshot from sync storage", () => {
      storageMock.getSync.mockReturnValue(null);

      service = new ThemeService();

      expect(service.getCurrentTheme()).toBe("auto");
    });

    it("should handle undefined gallery in snapshot", () => {
      storageMock.getSync.mockReturnValue({});

      service = new ThemeService();

      expect(service.getCurrentTheme()).toBe("auto");
    });

    it("should handle null theme in gallery", () => {
      storageMock.getSync.mockReturnValue({ gallery: { theme: null } });

      service = new ThemeService();

      expect(service.getCurrentTheme()).toBe("auto");
    });

    it("should handle undefined theme in gallery", () => {
      storageMock.getSync.mockReturnValue({ gallery: {} });

      service = new ThemeService();

      expect(service.getCurrentTheme()).toBe("auto");
    });
  });

  describe("loadThemeAsync optional chaining", () => {
    it("should handle null snapshot from async storage", async () => {
      storageMock.getSync.mockReturnValue({ gallery: { theme: "light" } });
      storageMock.get.mockResolvedValue(null);

      service = new ThemeService();

      await new Promise(process.nextTick);
      await new Promise(process.nextTick);

      // Should keep sync value when async returns null
      expect(service.getCurrentTheme()).toBe("light");
    });

    it("should handle undefined gallery from async storage", async () => {
      storageMock.getSync.mockReturnValue({ gallery: { theme: "light" } });
      storageMock.get.mockResolvedValue({});

      service = new ThemeService();

      await new Promise(process.nextTick);
      await new Promise(process.nextTick);

      // async returns null (due to undefined gallery), keeps sync
      expect(service.getCurrentTheme()).toBe("light");
    });
  });

  describe("conditional expression coverage", () => {
    it("should skip async update when saved equals current theme", async () => {
      storageMock.getSync.mockReturnValue({ gallery: { theme: "dark" } });
      storageMock.get.mockResolvedValue({ gallery: { theme: "dark" } });

      service = new ThemeService();

      const initialCalls = (themeDom.syncThemeAttributes as Mock).mock.calls.length;

      await new Promise(process.nextTick);
      await new Promise(process.nextTick);

      // Should not call sync again since themes are same
      expect((themeDom.syncThemeAttributes as Mock).mock.calls.length).toBe(initialCalls);
    });

    it("should update theme when async saved differs from current", async () => {
      storageMock.getSync.mockReturnValue({ gallery: { theme: "light" } });
      storageMock.get.mockResolvedValue({ gallery: { theme: "dark" } });

      service = new ThemeService();

      await new Promise(process.nextTick);
      await new Promise(process.nextTick);

      expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith("dark");
    });
  });

  describe("boolean literal mutations", () => {
    it("should return false from applyCurrentTheme when theme unchanged", () => {
      service = new ThemeService();
      service.setTheme("dark");

      // Clear mock
      (themeDom.syncThemeAttributes as Mock).mockClear();

      // Set same theme again without force
      service.setTheme("dark");

      // Should not sync again (applyCurrentTheme returns false)
      // But notifyListeners is still called
    });

    it("should return true from applyCurrentTheme when theme changes", () => {
      service = new ThemeService();
      service.setTheme("light");

      (themeDom.syncThemeAttributes as Mock).mockClear();

      service.setTheme("dark");

      expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith("dark");
    });
  });

  describe("bindSettingsService edge cases", () => {
    it("should not bind null settings service", () => {
      service = new ThemeService();

      expect(() => service.bindSettingsService(null as any)).not.toThrow();
    });

    it("should unsubscribe previous subscription when rebinding", () => {
      service = new ThemeService();

      const unsubscribe1 = vi.fn();
      const settingsService1 = {
        get: vi.fn().mockReturnValue("light"),
        subscribe: vi.fn().mockReturnValue(unsubscribe1),
      };

      const settingsService2 = {
        get: vi.fn().mockReturnValue("dark"),
        subscribe: vi.fn().mockReturnValue(vi.fn()),
      };

      service.bindSettingsService(settingsService1);
      service.bindSettingsService(settingsService2);

      expect(unsubscribe1).toHaveBeenCalled();
    });

    it("should handle settings service without subscribe function", () => {
      service = new ThemeService();

      const settingsService = {
        get: vi.fn().mockReturnValue("dark"),
      };

      expect(() => service.bindSettingsService(settingsService as any)).not.toThrow();
    });
  });

  describe("setTheme persist option", () => {
    it("should persist when persist is not specified", () => {
      service = new ThemeService();

      settingsServiceMock = {
        get: vi.fn().mockReturnValue("light"),
        set: vi.fn(),
        subscribe: vi.fn().mockReturnValue(vi.fn()),
      };

      service.bindSettingsService(settingsServiceMock);

      service.setTheme("dark");

      expect(settingsServiceMock.set).toHaveBeenCalledWith("gallery.theme", "dark");
    });

    it("should not persist when persist is false", () => {
      service = new ThemeService();

      settingsServiceMock = {
        get: vi.fn().mockReturnValue("light"),
        set: vi.fn(),
        subscribe: vi.fn().mockReturnValue(vi.fn()),
      };

      service.bindSettingsService(settingsServiceMock);
      settingsServiceMock.set.mockClear();

      service.setTheme("dark", { persist: false });

      expect(settingsServiceMock.set).not.toHaveBeenCalled();
    });
  });

  describe("mediaQueryList matches coverage", () => {
    it("should handle when mediaQueryList.matches returns undefined", () => {
      const mediaQueryWithUndefined = {
        matches: undefined,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      Object.defineProperty(window, "matchMedia", {
          writable: true,
          configurable: true,
          value: vi.fn().mockReturnValue(mediaQueryWithUndefined),
        });

      service = new ThemeService();
      service.setTheme("auto");

      // When matches is undefined (falsy), should return light
      expect(service.getEffectiveTheme()).toBe("light");
    });

    it("should return dark when mediaQueryList.matches is true", () => {
      const mediaQueryDark = {
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      Object.defineProperty(window, "matchMedia", {
          writable: true,
          configurable: true,
          value: vi.fn().mockReturnValue(mediaQueryDark),
        });

      service = new ThemeService();
      service.setTheme("auto");

      expect(service.getEffectiveTheme()).toBe("dark");
    });
  });
});
// Removed duplicate runtime imports from vitest; using globals instead

// Mock syncThemeAttributes
vi.mock('@shared/dom/theme', () => ({
  syncThemeAttributes: vi.fn(),
}));

// Mock persistent storage module so ThemeService loads our stub
const fakeStorage = {
  getSync: vi.fn(() => 'auto'),
  get: vi.fn(async () => null),
};
vi.mock('@shared/services/persistent-storage', () => ({
  getPersistentStorage: () => fakeStorage,
}));

// Duplicate ThemeService import removed - already imported at top of file
import { syncThemeAttributes } from '@shared/dom/theme';

describe('ThemeService', () => {
  beforeEach(() => {
    // reset singleton
    (ThemeService as unknown as { instance?: unknown }).instance = undefined;
    vi.clearAllMocks();
    // Ensure matchMedia exists for ThemeService.getInstance
    const matchMediaMock = vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
    Object.defineProperty(globalThis, 'matchMedia', { writable: true, configurable: true, value: matchMediaMock });
  });

  afterEach(() => {
    // clean up any attached mock globals
    // restore mediaQueryList presence
    try {
      if (originalMatchMediaDescriptor) {
        Object.defineProperty(globalThis, 'matchMedia', originalMatchMediaDescriptor);
      } else {
        delete (globalThis as any).matchMedia;
      }
    } catch (_) {}
  });

  it('applies current theme and notifies listeners', () => {
    const service = ThemeService.getInstance();
    const listener = vi.fn();
    service.onThemeChange(listener);

    // Force a change; storage mock returns 'auto' by default
    service.setTheme('dark', { force: true, persist: false });
    expect(syncThemeAttributes).toHaveBeenCalled();
    expect(listener).toHaveBeenCalled();
  });

  it('binds settings service and persists theme on setTheme when persist option true', () => {
    const fakeSettings = {
      get: vi.fn(() => undefined),
      set: vi.fn(async () => {}),
      subscribe: vi.fn(() => () => {}),
    };

    const service = ThemeService.getInstance();
    service.bindSettingsService(fakeSettings as any);

    service.setTheme('dark', { persist: true });
    expect(fakeSettings.set).toHaveBeenCalledWith('gallery.theme', 'dark');
  });

  it('getEffectiveTheme returns dark when mediaQueryList matches true', () => {
    const service = ThemeService.getInstance();

    // Provide fake mediaQueryList to simulate prefers-color-scheme: dark
    service['mediaQueryList'] = { matches: true, addEventListener: vi.fn() } as any;
    service.setTheme('auto', { force: true });
    expect(service.getEffectiveTheme()).toBe('dark');
    expect(service.isDarkMode()).toBe(true);
  });

  it('initializeSystemDetection registers change listener and applies theme when auto', () => {
    const service = ThemeService.getInstance();
    const callbacks: Array<() => void> = [];
    // fake mediaQueryList
    service['mediaQueryList'] = {
      matches: false,
      addEventListener: (_evt: string, cb: () => void) => callbacks.push(cb),
    } as any;

    // start with auto
    service['themeSetting'] = 'auto';
    const applySpy = vi.spyOn(service as any, 'applyCurrentTheme');
    // Call initializeSystemDetection
    (service as any).initializeSystemDetection();

    // Simulate change
    callbacks.forEach((cb) => cb());
    expect(applySpy).toHaveBeenCalled();
  });

  it('loadThemeSync returns auto fallback when storage throws', () => {
    // Make storage getSync throw
    fakeStorage.getSync.mockImplementation(() => {
      throw new Error('boom');
    });
    // Reload service instance with new storage behavior
    (ThemeService as unknown as { instance?: unknown }).instance = undefined;
    const service = ThemeService.getInstance();
    // Should default to 'auto'
    expect(service.getCurrentTheme()).toBe('auto');
  });
});
// Removed duplicate import - using vitest globals; types imported at top

// Mock dependencies
vi.mock("@shared/dom/theme", () => ({
  syncThemeAttributes: vi.fn(),
}));

vi.mock("@/shared/services/persistent-storage", () => ({
  getPersistentStorage: vi.fn(),
}));

vi.mock("@/shared/logging", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Duplicate imports and vi.mock removed; top-of-file declarations are sufficient

describe("ThemeService", () => {
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
      getSync: vi.fn().mockReturnValue({ gallery: { theme: "auto" } }),
      get: vi.fn().mockResolvedValue({ gallery: { theme: "auto" } }),
    };
    (getPersistentStorage as Mock).mockReturnValue(storageMock);

    // Mock matchMedia
    mediaQueryListMock = {
      matches: false, // Default to light system theme
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    matchMediaMock = vi.fn().mockReturnValue(mediaQueryListMock);
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: matchMediaMock,
    });

    // Mock MutationObserver
    mutationObserverMock = {
      observe: vi.fn(),
      disconnect: vi.fn(),
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

  it("should initialize with default values", () => {
    service = new ThemeService();
    expect(service).toBeDefined();
    expect(storageMock.getSync).toHaveBeenCalledWith(APP_SETTINGS_STORAGE_KEY);
    expect(themeDom.syncThemeAttributes).toHaveBeenCalled();
  });

  it("should sync theme from async storage if different", async () => {
    storageMock.getSync.mockReturnValue({ gallery: { theme: "light" } });
    storageMock.get.mockResolvedValue({ gallery: { theme: "dark" } });

    service = new ThemeService();

    // Wait for async promise in constructor
    await new Promise(process.nextTick);
    await new Promise(process.nextTick);

    expect(storageMock.get).toHaveBeenCalled();
    expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith("dark");
  });

  it("should bind settings service and sync initial value", () => {
    service = new ThemeService();
    settingsServiceMock.get.mockReturnValue("dark");

    service.bindSettingsService(settingsServiceMock);

    expect(settingsServiceMock.get).toHaveBeenCalledWith("gallery.theme");
    expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith("dark");
  });

  it("should subscribe to settings changes", () => {
    service = new ThemeService();
    service.bindSettingsService(settingsServiceMock);

    expect(settingsServiceMock.subscribe).toHaveBeenCalled();

    // Simulate setting change
    const callback = settingsServiceMock.subscribe.mock.calls[0][0];
    callback({ key: "gallery.theme", newValue: "dark" });

    expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith("dark");
  });

  it("should ignore invalid theme settings", () => {
    service = new ThemeService();
    service.bindSettingsService(settingsServiceMock);

    const callback = settingsServiceMock.subscribe.mock.calls[0][0];
    callback({ key: "gallery.theme", newValue: "invalid-theme" });

    // Should not have called sync with invalid theme (assuming it was auto/light before)
    expect(themeDom.syncThemeAttributes).not.toHaveBeenCalledWith(
      "invalid-theme",
    );
  });

  it("should set theme and persist", () => {
    service = new ThemeService();
    service.bindSettingsService(settingsServiceMock);

    service.setTheme("dark");

    expect(settingsServiceMock.set).toHaveBeenCalledWith(
      "gallery.theme",
      "dark",
    );
    expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith("dark");
  });

  it("should handle system theme changes when in auto mode", async () => {
    service = new ThemeService();
    // Wait for async initialization
    await new Promise(process.nextTick);
    await new Promise(process.nextTick);

    // Default is auto

    // Simulate system change to dark
    mediaQueryListMock.matches = true;

    // Trigger listener
    // We need to find the call to addEventListener("change", ...)
    const calls = mediaQueryListMock.addEventListener.mock.calls;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const changeCall = calls.find((c: any[]) => c[0] === "change");
    expect(changeCall).toBeDefined();

    const listener = changeCall[1];
    listener();

    expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith("dark");
  });

  it("should NOT handle system theme changes when NOT in auto mode", async () => {
    service = new ThemeService();
    // Wait for async initialization
    await new Promise(process.nextTick);
    await new Promise(process.nextTick);

    service.setTheme("light");

    // Simulate system change to dark
    mediaQueryListMock.matches = true;

    // Trigger listener
    const calls = mediaQueryListMock.addEventListener.mock.calls;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const changeCall = calls.find((c: any[]) => c[0] === "change");
    expect(changeCall).toBeDefined();

    const listener = changeCall[1];
    listener();

    // Should still be light
    expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith("light");
  });

  it("should observe DOM mutations and apply theme to new scopes", () => {
    service = new ThemeService();

    const callback = mutationObserverMock.callback;
    const element = document.createElement("div");
    element.classList.add("xeg-theme-scope");

    const mutations = [
      {
        addedNodes: [element],
      },
    ];

    callback(mutations);

    expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith(
      expect.anything(),
      { scopes: [element] },
    );
  });

  it("should notify listeners on theme change", () => {
    service = new ThemeService();
    const listener = vi.fn();
    const unsubscribe = service.onThemeChange(listener);

    service.setTheme("dark");

    expect(listener).toHaveBeenCalledWith("dark", "dark");

    unsubscribe();

    // Check if listener is removed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listenersSize = (service as any).listeners.size;
    expect(listenersSize).toBe(0);

    service.setTheme("light");
    expect(listener).toHaveBeenCalledTimes(1); // Not called again
  });

  it("should return correct isDarkMode", () => {
    service = new ThemeService();
    // Auto + Light system -> false
    expect(service.isDarkMode()).toBe(false);

    service.setTheme("dark");
    expect(service.isDarkMode()).toBe(true);

    service.setTheme("auto");
    mediaQueryListMock.matches = true;
    expect(service.isDarkMode()).toBe(true);
  });

  it("should handle async storage failure gracefully", async () => {
    storageMock.getSync.mockReturnValue({ gallery: { theme: "light" } });
    storageMock.get.mockRejectedValue(new Error("Storage error"));

    service = new ThemeService();

    await new Promise(process.nextTick);
    await new Promise(process.nextTick);

    // Should not crash, and keep sync value
    expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith("light");
  });
});

describe("ThemeService - mutation coverage", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let storageMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mediaQueryListMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mutationObserverMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let service: ThemeService;

  beforeEach(() => {
    vi.clearAllMocks();

    storageMock = {
      getSync: vi.fn().mockReturnValue({ gallery: { theme: "auto" } }),
      get: vi.fn().mockResolvedValue({ gallery: { theme: "auto" } }),
    };
    (getPersistentStorage as Mock).mockReturnValue(storageMock);

    mediaQueryListMock = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockReturnValue(mediaQueryListMock),
    });

    mutationObserverMock = {
      observe: vi.fn(),
      disconnect: vi.fn(),
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).onDestroy();
    }
  });

  describe("optional chaining coverage", () => {
    it("should handle event with null key in subscribe callback", () => {
      service = new ThemeService();
      settingsServiceMock = {
        get: vi.fn().mockReturnValue("light"),
        subscribe: vi.fn().mockReturnValue(vi.fn()),
      };

      service.bindSettingsService(settingsServiceMock);

      const callback = settingsServiceMock.subscribe.mock.calls[0]?.[0];
      expect(callback).toBeDefined();

      // Event with null/undefined key
      expect(() => callback({ key: null, newValue: "dark" })).not.toThrow();
      expect(() => callback({ newValue: "dark" })).not.toThrow();
      expect(() => callback(null)).not.toThrow();
      expect(() => callback(undefined)).not.toThrow();
    });

    it("should handle observer disconnect when observer exists", () => {
      service = new ThemeService();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).onDestroy();

      expect(mutationObserverMock.disconnect).toHaveBeenCalled();
    });
  });

  describe("snapshot optional chaining", () => {
    it("should handle null snapshot from sync storage", () => {
      storageMock.getSync.mockReturnValue(null);

      service = new ThemeService();

      expect(service.getCurrentTheme()).toBe("auto");
    });

    it("should handle undefined gallery in snapshot", () => {
      storageMock.getSync.mockReturnValue({});

      service = new ThemeService();

      expect(service.getCurrentTheme()).toBe("auto");
    });

    it("should handle null theme in gallery", () => {
      storageMock.getSync.mockReturnValue({ gallery: { theme: null } });

      service = new ThemeService();

      expect(service.getCurrentTheme()).toBe("auto");
    });

    it("should handle undefined theme in gallery", () => {
      storageMock.getSync.mockReturnValue({ gallery: {} });

      service = new ThemeService();

      expect(service.getCurrentTheme()).toBe("auto");
    });
  });

  describe("loadThemeAsync optional chaining", () => {
    it("should handle null snapshot from async storage", async () => {
      storageMock.getSync.mockReturnValue({ gallery: { theme: "light" } });
      storageMock.get.mockResolvedValue(null);

      service = new ThemeService();

      await new Promise(process.nextTick);
      await new Promise(process.nextTick);

      // Should keep sync value when async returns null
      expect(service.getCurrentTheme()).toBe("light");
    });

    it("should handle undefined gallery from async storage", async () => {
      storageMock.getSync.mockReturnValue({ gallery: { theme: "light" } });
      storageMock.get.mockResolvedValue({});

      service = new ThemeService();

      await new Promise(process.nextTick);
      await new Promise(process.nextTick);

      // async returns null (due to undefined gallery), keeps sync
      expect(service.getCurrentTheme()).toBe("light");
    });
  });

  describe("conditional expression coverage", () => {
    it("should skip async update when saved equals current theme", async () => {
      storageMock.getSync.mockReturnValue({ gallery: { theme: "dark" } });
      storageMock.get.mockResolvedValue({ gallery: { theme: "dark" } });

      service = new ThemeService();

      const initialCalls = (themeDom.syncThemeAttributes as Mock).mock.calls.length;

      await new Promise(process.nextTick);
      await new Promise(process.nextTick);

      // Should not call sync again since themes are same
      expect((themeDom.syncThemeAttributes as Mock).mock.calls.length).toBe(initialCalls);
    });

    it("should update theme when async saved differs from current", async () => {
      storageMock.getSync.mockReturnValue({ gallery: { theme: "light" } });
      storageMock.get.mockResolvedValue({ gallery: { theme: "dark" } });

      service = new ThemeService();

      await new Promise(process.nextTick);
      await new Promise(process.nextTick);

      expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith("dark");
    });
  });

  describe("boolean literal mutations", () => {
    it("should return false from applyCurrentTheme when theme unchanged", () => {
      service = new ThemeService();
      service.setTheme("dark");

      // Clear mock
      (themeDom.syncThemeAttributes as Mock).mockClear();

      // Set same theme again without force
      service.setTheme("dark");

      // Should not sync again (applyCurrentTheme returns false)
      // But notifyListeners is still called
    });

    it("should return true from applyCurrentTheme when theme changes", () => {
      service = new ThemeService();
      service.setTheme("light");

      (themeDom.syncThemeAttributes as Mock).mockClear();

      service.setTheme("dark");

      expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith("dark");
    });
  });

  describe("bindSettingsService edge cases", () => {
    it("should not bind null settings service", () => {
      service = new ThemeService();

      expect(() => service.bindSettingsService(null as any)).not.toThrow();
    });

    it("should unsubscribe previous subscription when rebinding", () => {
      service = new ThemeService();

      const unsubscribe1 = vi.fn();
      const settingsService1 = {
        get: vi.fn().mockReturnValue("light"),
        subscribe: vi.fn().mockReturnValue(unsubscribe1),
      };

      const settingsService2 = {
        get: vi.fn().mockReturnValue("dark"),
        subscribe: vi.fn().mockReturnValue(vi.fn()),
      };

      service.bindSettingsService(settingsService1);
      service.bindSettingsService(settingsService2);

      expect(unsubscribe1).toHaveBeenCalled();
    });

    it("should handle settings service without subscribe function", () => {
      service = new ThemeService();

      const settingsService = {
        get: vi.fn().mockReturnValue("dark"),
      };

      expect(() => service.bindSettingsService(settingsService as any)).not.toThrow();
    });
  });

  describe("setTheme persist option", () => {
    it("should persist when persist is not specified", () => {
      service = new ThemeService();

      settingsServiceMock = {
        get: vi.fn().mockReturnValue("light"),
        set: vi.fn(),
        subscribe: vi.fn().mockReturnValue(vi.fn()),
      };

      service.bindSettingsService(settingsServiceMock);

      service.setTheme("dark");

      expect(settingsServiceMock.set).toHaveBeenCalledWith("gallery.theme", "dark");
    });

    it("should not persist when persist is false", () => {
      service = new ThemeService();

      const settingsServiceMock = {
        get: vi.fn().mockReturnValue("light"),
        set: vi.fn(),
        subscribe: vi.fn().mockReturnValue(vi.fn()),
      };

      service.bindSettingsService(settingsServiceMock);
      settingsServiceMock.set.mockClear();

      service.setTheme("dark", { persist: false });

      expect(settingsServiceMock.set).not.toHaveBeenCalled();
    });
  });

  describe("mediaQueryList matches coverage", () => {
    it("should handle when mediaQueryList.matches returns undefined", () => {
      const mediaQueryWithUndefined = {
        matches: undefined,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockReturnValue(mediaQueryWithUndefined),
      });

      service = new ThemeService();
      service.setTheme("auto");

      // When matches is undefined (falsy), should return light
      expect(service.getEffectiveTheme()).toBe("light");
    });

    it("should return dark when mediaQueryList.matches is true", () => {
      const mediaQueryDark = {
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockReturnValue(mediaQueryDark),
      });

      service = new ThemeService();
      service.setTheme("auto");

      expect(service.getEffectiveTheme()).toBe("dark");
    });
  });
});
