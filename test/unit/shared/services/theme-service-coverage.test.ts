import { getPersistentStorage } from "@/shared/services/persistent-storage";
import { ThemeService } from "@/shared/services/theme-service";
import * as themeDom from "@shared/dom/theme";
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
    type Mock,
} from "vitest";

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

describe("ThemeService Coverage", () => {
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
    // Reset singleton if possible, though we use new ThemeService()
    // @ts-ignore
    ThemeService.instance = undefined;

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

    // Mock SettingsService
    settingsServiceMock = {
      get: vi.fn(),
      set: vi.fn(),
      subscribe: vi.fn().mockReturnValue(vi.fn()),
    };
  });

  afterEach(() => {
    if (service) {
      // @ts-ignore
      service.onDestroy();
    }
  });

  it("should handle MutationObserver detecting new nodes with xeg-theme-scope", () => {
    service = new ThemeService();

    const nodeWithClass = document.createElement("div");
    nodeWithClass.classList.add("xeg-theme-scope");

    const nodeWithChild = document.createElement("div");
    const childWithClass = document.createElement("div");
    childWithClass.classList.add("xeg-theme-scope");
    nodeWithChild.appendChild(childWithClass);

    const mutations = [
      {
        addedNodes: [
          nodeWithClass,
          nodeWithChild,
          document.createTextNode("text"),
        ],
      },
    ];

    // Trigger observer callback
    mutationObserverMock.callback(mutations);

    // Should call syncThemeAttributes for nodeWithClass and childWithClass
    expect(themeDom.syncThemeAttributes).toHaveBeenCalledTimes(3); // Initial sync + 2 from mutations
  });

  it("should bind SettingsService and sync initial value", () => {
    service = new ThemeService();
    settingsServiceMock.get.mockReturnValue("dark");

    service.bindSettingsService(settingsServiceMock);

    expect(service.getCurrentTheme()).toBe("dark");
    expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith("dark");
  });

  it("should update theme when SettingsService notifies change", () => {
    service = new ThemeService();
    // Capture subscriber
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let subscriber: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    settingsServiceMock.subscribe.mockImplementation((cb: any) => {
      subscriber = cb;
      return vi.fn();
    });

    service.bindSettingsService(settingsServiceMock);

    // Simulate change event
    subscriber({ key: "gallery.theme", newValue: "dark" });

    expect(service.getCurrentTheme()).toBe("dark");
    expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith("dark");
  });

  it("should persist theme to SettingsService when setting theme", () => {
    service = new ThemeService();
    service.bindSettingsService(settingsServiceMock);

    service.setTheme("dark", { persist: true });

    expect(settingsServiceMock.set).toHaveBeenCalledWith(
      "gallery.theme",
      "dark",
    );
  });

  it("should fallback to light for invalid theme setting", () => {
    service = new ThemeService();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service.setTheme("invalid-theme" as any);

    expect(service.getCurrentTheme()).toBe("light");
  });

  it("should handle system theme change when in auto mode", async () => {
    service = new ThemeService();
    service.setTheme("auto");

    // Wait for async initialization
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Simulate system theme change to dark
    mediaQueryListMock.matches = true;

    // Find the change listener
    const changeListener = mediaQueryListMock.addEventListener.mock.calls.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (call: any) => call[0] === "change",
    )[1];

    expect(changeListener).toBeDefined();
    changeListener();

    expect(themeDom.syncThemeAttributes).toHaveBeenCalledWith("dark");
  });

  it("should handle loadThemeSync error", () => {
    storageMock.getSync.mockImplementation(() => {
      throw new Error("Storage error");
    });

    service = new ThemeService();
    expect(service.getCurrentTheme()).toBe("auto");
  });

  it("should skip bindSettingsService if already bound with same service", () => {
    service = new ThemeService();
    settingsServiceMock.get.mockReturnValue("light");

    service.bindSettingsService(settingsServiceMock);
    const firstCallCount = settingsServiceMock.get.mock.calls.length;

    // Bind again with the same service - should be no-op
    service.bindSettingsService(settingsServiceMock);

    // Should not call get again
    expect(settingsServiceMock.get.mock.calls.length).toBe(firstCallCount);
  });

  it("should skip bindSettingsService if service is null", () => {
    service = new ThemeService();

    // Should not throw
    service.bindSettingsService(null as any);

    expect(service).toBeDefined();
  });

  it("should unsubscribe from previous settings service when rebinding", () => {
    service = new ThemeService();

    const unsubscribe1 = vi.fn();
    const settingsService1 = {
      get: vi.fn().mockReturnValue("light"),
      set: vi.fn(),
      subscribe: vi.fn().mockReturnValue(unsubscribe1),
    };

    const unsubscribe2 = vi.fn();
    const settingsService2 = {
      get: vi.fn().mockReturnValue("dark"),
      set: vi.fn(),
      subscribe: vi.fn().mockReturnValue(unsubscribe2),
    };

    service.bindSettingsService(settingsService1);
    service.bindSettingsService(settingsService2);

    // First unsubscribe should be called when rebinding
    expect(unsubscribe1).toHaveBeenCalled();
  });

  it("should not persist theme when persist option is false", () => {
    service = new ThemeService();
    service.bindSettingsService(settingsServiceMock);
    settingsServiceMock.set.mockClear();

    service.setTheme("dark", { persist: false });

    expect(settingsServiceMock.set).not.toHaveBeenCalled();
    expect(service.getCurrentTheme()).toBe("dark");
  });

  it("should not apply theme when settings change with same value", () => {
    service = new ThemeService();
    service.setTheme("dark");

    let subscriber: any;
    settingsServiceMock.subscribe.mockImplementation((cb: any) => {
      subscriber = cb;
      return vi.fn();
    });

    service.bindSettingsService(settingsServiceMock);

    const syncCallCount = (themeDom.syncThemeAttributes as Mock).mock.calls.length;

    // Trigger with same value
    subscriber({ key: "gallery.theme", newValue: "dark" });

    // Should not call sync again (same value)
    expect((themeDom.syncThemeAttributes as Mock).mock.calls.length).toBe(syncCallCount);
  });

  it("should ignore settings change for wrong key", () => {
    service = new ThemeService();

    let subscriber: any;
    settingsServiceMock.subscribe.mockImplementation((cb: any) => {
      subscriber = cb;
      return vi.fn();
    });

    service.bindSettingsService(settingsServiceMock);

    const syncCallCount = (themeDom.syncThemeAttributes as Mock).mock.calls.length;

    // Trigger with wrong key
    subscriber({ key: "gallery.other", newValue: "dark" });

    // Should not call sync
    expect((themeDom.syncThemeAttributes as Mock).mock.calls.length).toBe(syncCallCount);
  });

  it("should handle onInitialize and bind SettingsService if available", async () => {
    // Create mock for tryGetSettingsManager
    const mockSettingsService = {
      get: vi.fn().mockReturnValue("dark"),
      set: vi.fn(),
      subscribe: vi.fn().mockReturnValue(vi.fn()),
    };

    vi.doMock("@shared/container/service-accessors", () => ({
      tryGetSettingsManager: vi.fn().mockReturnValue(mockSettingsService),
    }));

    service = new ThemeService();

    // Call onInitialize directly (protected method)
    await (service as any).onInitialize();

    // Service should be initialized
    expect(service).toBeDefined();
  });

  it("should handle onInitialize when SettingsService is not available", async () => {
    vi.doMock("@shared/container/service-accessors", () => ({
      tryGetSettingsManager: vi.fn().mockReturnValue(null),
    }));

    service = new ThemeService();

    // Call onInitialize directly - should not throw
    await (service as any).onInitialize();

    expect(service).toBeDefined();
  });

  it("should handle onInitialize import error gracefully", async () => {
    vi.doMock("@shared/container/service-accessors", () => {
      throw new Error("Import error");
    });

    service = new ThemeService();

    // Call onInitialize directly - should not throw
    await (service as any).onInitialize();

    expect(service).toBeDefined();
  });

  it("should sync theme from async if different from sync", async () => {
    storageMock.getSync.mockReturnValue({ gallery: { theme: "light" } });
    storageMock.get.mockResolvedValue({ gallery: { theme: "dark" } });

    service = new ThemeService();

    // Wait for async initialization
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(service.getCurrentTheme()).toBe("dark");
  });

  it("should call notifyListeners when force applying theme with no change", () => {
    service = new ThemeService();

    const listener = vi.fn();
    service.onThemeChange(listener);

    // Apply same theme with force
    service.setTheme("light", { force: true });

    // Listener should be called
    expect(listener).toHaveBeenCalled();
  });

  it("should handle bindSettingsService when subscribe is not a function", () => {
    service = new ThemeService();

    const serviceWithoutSubscribe = {
      get: vi.fn().mockReturnValue("light"),
      set: vi.fn(),
      subscribe: null, // Not a function
    };

    // Should not throw
    service.bindSettingsService(serviceWithoutSubscribe as any);

    expect(service.getCurrentTheme()).toBe("light");
  });
});
