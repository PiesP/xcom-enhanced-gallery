import { tryGetSettingsManager } from "@shared/container/service-accessors";
import {
    useToolbarSettingsController,
    type UseToolbarSettingsControllerOptions,
} from "@shared/hooks/toolbar/use-toolbar-settings-controller";
import { logger } from "@shared/logging";
import type { LanguageService } from "@shared/services/language-service";
import type { ThemeServiceContract } from "@shared/services/theme-service";
import { createRoot, createSignal } from "solid-js";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

// Mock dependencies
vi.mock("@shared/logging", () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@shared/external/vendors", async () => {
  const actual = await vi.importActual<typeof import("solid-js")>("solid-js");
  return {
    getSolid: () => actual,
  };
});

vi.mock("@shared/utils/time/timer-management", () => ({
  globalTimerManager: {
    setTimeout: vi.fn((cb, delay) => setTimeout(cb, delay)),
    clearTimeout: vi.fn((id) => clearTimeout(id)),
  },
}));

vi.mock("@shared/container/service-accessors", () => ({
  getThemeService: vi.fn(),
  getLanguageService: vi.fn(),
  tryGetSettingsManager: vi.fn(),
}));

describe("useToolbarSettingsController Coverage", () => {
  let mockThemeService: ThemeServiceContract;
  let mockLanguageService: LanguageService;
  let mockSetSettingsExpanded: Mock;
  let mockToggleSettingsExpanded: Mock;
  let documentRefMock: Document;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockThemeService = {
      getCurrentTheme: vi.fn().mockReturnValue("auto"),
      setTheme: vi.fn(),
      onThemeChange: vi.fn().mockReturnValue(() => {}),
      isInitialized: vi.fn().mockReturnValue(true),
      initialize: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn(),
      getEffectiveTheme: vi.fn().mockReturnValue("light"),
      isDarkMode: vi.fn().mockReturnValue(false),
      bindSettingsService: vi.fn(),
    };

    mockLanguageService = {
      getCurrentLanguage: vi.fn().mockReturnValue("en"),
      setLanguage: vi.fn(),
      onLanguageChange: vi.fn().mockReturnValue(() => {}),
      translate: vi.fn((key) => key),
    } as unknown as LanguageService;

    mockSetSettingsExpanded = vi.fn();
    mockToggleSettingsExpanded = vi.fn();

    // Mock document
    documentRefMock = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as Document;
  });

  const createController = (
    options: Partial<UseToolbarSettingsControllerOptions> = {},
  ) => {
    return createRoot((dispose) => {
      const [expanded, setExpanded] = createSignal(false);

      const controller = useToolbarSettingsController({
        isSettingsExpanded: expanded,
        setSettingsExpanded: (val) => {
          setExpanded(val);
          mockSetSettingsExpanded(val);
        },
        toggleSettingsExpanded: () => {
          setExpanded(!expanded());
          mockToggleSettingsExpanded();
        },
        themeService: mockThemeService,
        languageService: mockLanguageService,
        documentRef: documentRefMock,
        ...options,
      });
      return { controller, dispose, setExpanded };
    });
  };

  it("should stop outside-click wiring when documentRef is unavailable", () => {
    const { controller, setExpanded } = createController({
      documentRef: null as unknown as Document,
    });

    const panel = document.createElement("div");
    controller.assignSettingsPanelRef(panel);
    setExpanded(true);

    expect((documentRefMock.addEventListener as Mock)).not.toHaveBeenCalled();
    expect(mockSetSettingsExpanded).not.toHaveBeenCalled();
  });

  it("should handle select focus, blur and change events correctly", () => {
    const { controller, setExpanded } = createController();

    // Setup DOM elements
    const panel = document.createElement("div");
    const select = document.createElement("select");
    vi.spyOn(select, "addEventListener");
    panel.appendChild(select);

    controller.assignSettingsPanelRef(panel);
    setExpanded(true); // Trigger effect

    expect(select.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );

    const focusHandler = (select.addEventListener as Mock).mock.calls.find(
      (call) => call[0] === "focus",
    )?.[1];
    const blurHandler = (select.addEventListener as Mock).mock.calls.find(
      (call) => call[0] === "blur",
    )?.[1];
    const changeHandler = (select.addEventListener as Mock).mock.calls.find(
      (call) => call[0] === "change",
    )?.[1];

    // Focus
    focusHandler();
    // isSelectActive should be true

    // Simulate outside click
    const outsideClickEvent = {
      target: document.createElement("div"),
    } as unknown as MouseEvent;
    // We need to trigger the document mousedown handler.
    // The handler is attached to documentRef.

    // Get the handler passed to documentRef.addEventListener
    const addEventListenerMock = documentRefMock.addEventListener as Mock;
    const mousedownHandler = addEventListenerMock.mock.calls.find(
      (call) => call[0] === "mousedown",
    )?.[1];

    expect(mousedownHandler).toBeDefined();

    // Trigger outside click while focused
    mousedownHandler(outsideClickEvent);
    // Should NOT close because isSelectActive is true
    expect(mockSetSettingsExpanded).not.toHaveBeenCalled();

    // Blur
    blurHandler();
    // Timeout scheduled to set isSelectActive to false

    // Advance timer
    vi.advanceTimersByTime(100);

    // Now outside click should close
    mousedownHandler(outsideClickEvent);
    expect(mockSetSettingsExpanded).toHaveBeenCalledWith(false);

    // Reset
    mockSetSettingsExpanded.mockClear();

    // Change event
    changeHandler();
    // isSelectActive true, timeout scheduled

    mousedownHandler(outsideClickEvent);
    expect(mockSetSettingsExpanded).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300); // Default guard time

    mousedownHandler(outsideClickEvent);
    expect(mockSetSettingsExpanded).toHaveBeenCalledWith(false);
  });

  it("should not close when clicking inside toolbar or settings button", () => {
    const { controller, setExpanded } = createController();
    const panel = document.createElement("div");
    const toolbar = document.createElement("div");
    const button = document.createElement("button");

    controller.assignSettingsPanelRef(panel);
    controller.assignToolbarRef(toolbar);
    controller.assignSettingsButtonRef(button);
    setExpanded(true);

    const addEventListenerMock = documentRefMock.addEventListener as Mock;
    const mousedownHandler = addEventListenerMock.mock.calls.find(
      (call) => call[0] === "mousedown",
    )?.[1];

    // Click inside toolbar
    const toolbarClick = { target: toolbar } as unknown as MouseEvent;
    mousedownHandler(toolbarClick);
    expect(mockSetSettingsExpanded).not.toHaveBeenCalled();

    // Click inside button
    const buttonClick = { target: button } as unknown as MouseEvent;
    mousedownHandler(buttonClick);
    expect(mockSetSettingsExpanded).not.toHaveBeenCalled();

    // Click inside panel
    const panelClick = { target: panel } as unknown as MouseEvent;
    mousedownHandler(panelClick);
    expect(mockSetSettingsExpanded).not.toHaveBeenCalled();
  });

  it("should handle theme change error when settings service fails", async () => {
    const { controller } = createController();

    // Mock settings service to fail
    const mockSettingsService = {
      set: vi.fn().mockRejectedValue(new Error("Settings save failed")),
    };
    (tryGetSettingsManager as Mock).mockReturnValue(mockSettingsService);

    const select = document.createElement("select");
    const option = document.createElement("option");
    option.value = "dark";
    select.appendChild(option);
    select.value = "dark";
    const event = { target: select } as unknown as Event;

    controller.handleThemeChange(event);

    expect(mockThemeService.setTheme).toHaveBeenCalledWith("dark");
    expect(mockSettingsService.set).toHaveBeenCalledWith(
      "gallery.theme",
      "dark",
    );

    // Wait for promise to reject and be caught
    await Promise.resolve();
    await Promise.resolve(); // Extra tick for safety

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Failed to sync theme"),
      expect.any(Error),
    );
  });

  it("should ignore outside clicks when event target is missing", () => {
    const { controller, setExpanded } = createController();
    const panel = document.createElement("div");
    controller.assignSettingsPanelRef(panel);
    setExpanded(true);

    const addEventListenerMock = documentRefMock.addEventListener as Mock;
    const mousedownHandler = addEventListenerMock.mock.calls.find(
      (call) => call[0] === "mousedown",
    )?.[1];

    expect(mousedownHandler).toBeDefined();

    mousedownHandler?.({ target: null } as unknown as MouseEvent);
    expect(mockSetSettingsExpanded).not.toHaveBeenCalled();
  });

  it("should handle theme change when settings service is unavailable", () => {
    const { controller } = createController();

    // Mock settings service to be null
    (tryGetSettingsManager as Mock).mockReturnValue(null);

    const select = document.createElement("select");
    const option = document.createElement("option");
    option.value = "light";
    select.appendChild(option);
    select.value = "light";
    const event = { target: select } as unknown as Event;

    controller.handleThemeChange(event);

    expect(mockThemeService.setTheme).toHaveBeenCalledWith("light");
    // Should log debug message
    // Note: The implementation catches the error if tryGetSettingsManager throws,
    // but if it returns null, it just skips.
    // Wait, looking at the code:
    /*
    try {
      const settingsService = tryGetSettingsManager...
      if (settingsService) { ... }
    } catch (error) {
      logger.debug(...)
    }
    */
    // So if tryGetSettingsManager throws, it logs debug.

    (tryGetSettingsManager as Mock).mockImplementation(() => {
      throw new Error("Service locator error");
    });

    controller.handleThemeChange(event);
    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining("SettingsService not available"),
      expect.any(Error),
    );
  });
});
