import {
  useToolbarSettingsController,
  type UseToolbarSettingsControllerOptions,
} from '@shared/hooks/toolbar/use-toolbar-settings-controller';
import type { LanguageService } from '@shared/services/language-service';
import type { ThemeServiceContract } from '@shared/services/theme-service';
import { tryGetSettingsManager } from '@shared/container/service-accessors';
import { logger } from '@shared/logging';
import { createRoot, createSignal } from 'solid-js';
// Use vitest globals; only import types when needed
import type { Mock } from 'vitest';
import { globalTimerManager } from '@shared/utils/time/timer-management';

// Mock dependencies
vi.mock('@shared/logging', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@shared/external/vendors', async () => {
  const actual = await vi.importActual<unknown>('solid-js');
  return {
    getSolid: () => actual,
  };
});

vi.mock('@shared/utils/time/timer-management', () => ({
  globalTimerManager: {
    setTimeout: vi.fn((cb, delay) => setTimeout(cb, delay)),
    clearTimeout: vi.fn(id => clearTimeout(id)),
  },
}));

vi.mock('@shared/container/service-accessors', () => ({
  getThemeService: vi.fn(),
  getLanguageService: vi.fn(),
  tryGetSettingsManager: vi.fn(),
}));

describe('useToolbarSettingsController Mutation Tests', () => {
  let mockThemeService: ThemeServiceContract;
  let mockLanguageService: LanguageService;
  let mockSetSettingsExpanded: Mock;
  let mockToggleSettingsExpanded: Mock;
  let mockSettingsManager: { set: Mock };

  beforeEach(() => {
    vi.clearAllMocks();

    mockThemeService = {
      getCurrentTheme: vi.fn().mockReturnValue('auto'),
      setTheme: vi.fn(),
      onThemeChange: vi.fn().mockReturnValue(() => {}),
      isInitialized: vi.fn().mockReturnValue(true),
      initialize: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn(),
      getEffectiveTheme: vi.fn().mockReturnValue('light'),
      isDarkMode: vi.fn().mockReturnValue(false),
      bindSettingsService: vi.fn(),
    };

    mockLanguageService = {
      getCurrentLanguage: vi.fn().mockReturnValue('en'),
      setLanguage: vi.fn(),
      onLanguageChange: vi.fn().mockReturnValue(() => undefined),
      translate: vi.fn(key => key),
    } as unknown as LanguageService;

    mockSettingsManager = {
      set: vi.fn().mockResolvedValue(undefined),
    };

    mockSetSettingsExpanded = vi.fn();
    mockToggleSettingsExpanded = vi.fn();

    (tryGetSettingsManager as Mock).mockReturnValue(mockSettingsManager);
  });

  const createController = (options: Partial<UseToolbarSettingsControllerOptions> = {}) => {
    return createRoot(dispose => {
      const [expanded, setExpanded] = createSignal(false);

      const controller = useToolbarSettingsController({
        isSettingsExpanded: expanded,
        setSettingsExpanded: val => {
          setExpanded(val);
          mockSetSettingsExpanded(val);
        },
        toggleSettingsExpanded: () => {
          setExpanded(!expanded());
          mockToggleSettingsExpanded();
        },
        themeService: mockThemeService,
        languageService: mockLanguageService,
        ...options,
      });
      return { controller, dispose, setExpanded };
    });
  };

  describe('Theme Handling', () => {
    it('should handle invalid theme values by defaulting to auto', () => {
      mockThemeService.getCurrentTheme = vi.fn().mockReturnValue('invalid-theme');
      const { controller, dispose } = createController();
      expect(controller.currentTheme()).toBe('auto');
      dispose();
    });

    it('should handle theme change with valid value', () => {
      const { controller, dispose } = createController();
      const event = {
        target: { value: 'dark' } as HTMLSelectElement,
      } as unknown as Event;

      controller.handleThemeChange(event);

      expect(controller.currentTheme()).toBe('dark');
      expect(mockThemeService.setTheme).toHaveBeenCalledWith('dark');
      expect(mockSettingsManager.set).toHaveBeenCalledWith('gallery.theme', 'dark');
      dispose();
    });

    it('should handle theme change with invalid value', () => {
      const { controller, dispose } = createController();
      const event = {
        target: { value: 'invalid' } as HTMLSelectElement,
      } as unknown as Event;

      controller.handleThemeChange(event);

      expect(controller.currentTheme()).toBe('auto');
      expect(mockThemeService.setTheme).toHaveBeenCalledWith('auto');
      dispose();
    });

    it('should handle theme change when target is null', () => {
      const { controller, dispose } = createController();
      const event = { target: null } as unknown as Event;

      controller.handleThemeChange(event);

      expect(mockThemeService.setTheme).not.toHaveBeenCalled();
      dispose();
    });

    it('should handle settings manager missing during theme change', () => {
      (tryGetSettingsManager as Mock).mockImplementation(() => {
        throw new Error('Service not found');
      });

      const { controller, dispose } = createController();
      const event = {
        target: { value: 'light' } as HTMLSelectElement,
      } as unknown as Event;

      controller.handleThemeChange(event);

      expect(mockThemeService.setTheme).toHaveBeenCalledWith('light');
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('SettingsService not available'),
        expect.anything()
      );
      dispose();
    });
  });

  describe('Language Handling', () => {
    it('should handle language change', () => {
      const { controller, dispose } = createController();
      const event = {
        target: { value: 'ko' } as HTMLSelectElement,
      } as unknown as Event;

      controller.handleLanguageChange(event);

      expect(controller.currentLanguage()).toBe('ko');
      expect(mockLanguageService.setLanguage).toHaveBeenCalledWith('ko');
      dispose();
    });

    it('should handle language change with empty value defaulting to auto', () => {
      const { controller, dispose } = createController();
      const event = {
        target: { value: '' } as HTMLSelectElement,
      } as unknown as Event;

      controller.handleLanguageChange(event);

      expect(controller.currentLanguage()).toBe('auto');
      expect(mockLanguageService.setLanguage).toHaveBeenCalledWith('auto');
      dispose();
    });

    it('should handle language change when target is null', () => {
      const { controller, dispose } = createController();
      const event = { target: null } as unknown as Event;

      controller.handleLanguageChange(event);

      expect(mockLanguageService.setLanguage).not.toHaveBeenCalled();
      dispose();
    });
  });

  describe('Initialization Logic', () => {
    it('should initialize theme service if not initialized', async () => {
      mockThemeService.isInitialized = vi.fn().mockReturnValue(false);
      const { dispose } = createController();

      // Wait for promise resolution
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockThemeService.initialize).toHaveBeenCalled();
      dispose();
    });

    it('should handle theme service initialization failure', async () => {
      mockThemeService.isInitialized = vi.fn().mockReturnValue(false);
      mockThemeService.initialize = vi.fn().mockRejectedValue(new Error('Init failed'));

      const { dispose } = createController();

      // Wait for promise resolution
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('ThemeService initialization failed'),
        expect.any(Error)
      );
      dispose();
    });
  });

  describe('Event Handling', () => {
    it('handleSettingsClick should stop immediate propagation and toggle settings', () => {
      const { controller, dispose } = createController();
      const event = {
        stopImmediatePropagation: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as MouseEvent;

      controller.handleSettingsClick(event);

      expect(event.stopImmediatePropagation).toHaveBeenCalled();
      expect(mockToggleSettingsExpanded).toHaveBeenCalled();
      dispose();
    });

    it('handleSettingsClick should handle missing stopImmediatePropagation (optional chaining)', () => {
      const { controller, dispose } = createController();
      const event = {
        stopPropagation: vi.fn(),
      } as unknown as MouseEvent;

      // Should not throw
      controller.handleSettingsClick(event);
      expect(mockToggleSettingsExpanded).toHaveBeenCalled();
      dispose();
    });

    it('handleSettingsClick should focus first control when opening', () => {
      vi.useFakeTimers();
      const { controller, dispose, setExpanded } = createController();
      setExpanded(false); // Ensure it's closed initially

      const mockFocus = vi.fn();
      const mockSelect = { focus: mockFocus } as unknown as HTMLSelectElement;
      const mockPanel = {
        querySelector: vi.fn().mockReturnValue(mockSelect),
        querySelectorAll: vi.fn().mockReturnValue([]),
      } as unknown as HTMLDivElement;

      controller.assignSettingsPanelRef(mockPanel);

      const event = { stopImmediatePropagation: vi.fn() } as unknown as MouseEvent;
      controller.handleSettingsClick(event);

      // Fast-forward timers
      vi.runAllTimers();

      expect(mockPanel.querySelector).toHaveBeenCalledWith('select');
      expect(mockFocus).toHaveBeenCalledWith({ preventScroll: true });
      vi.useRealTimers();
      dispose();
    });

    it('handleSettingsMouseDown should stop propagation', () => {
      const { controller, dispose } = createController();
      const event = { stopPropagation: vi.fn() } as unknown as MouseEvent;

      controller.handleSettingsMouseDown(event);

      expect(event.stopPropagation).toHaveBeenCalled();
      dispose();
    });

    it('handlePanelMouseDown should stop propagation', () => {
      const { controller, dispose } = createController();
      const event = { stopPropagation: vi.fn() } as unknown as MouseEvent;

      controller.handlePanelMouseDown(event);

      expect(event.stopPropagation).toHaveBeenCalled();
      dispose();
    });

    it('handlePanelClick should stop propagation', () => {
      const { controller, dispose } = createController();
      const event = { stopPropagation: vi.fn() } as unknown as MouseEvent;

      controller.handlePanelClick(event);

      expect(event.stopPropagation).toHaveBeenCalled();
      dispose();
    });

    it('handleToolbarKeyDown should close settings on Escape', () => {
      vi.useFakeTimers();
      const { controller, dispose, setExpanded } = createController();
      setExpanded(true); // Must be open to close

      const mockButtonFocus = vi.fn();
      const mockButton = { focus: mockButtonFocus } as unknown as HTMLButtonElement;
      controller.assignSettingsButtonRef(mockButton);

      const event = {
        key: 'Escape',
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as KeyboardEvent;

      controller.handleToolbarKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(mockSetSettingsExpanded).toHaveBeenCalledWith(false);

      // Fast-forward timers for focus restoration
      vi.runAllTimers();
      expect(mockButtonFocus).toHaveBeenCalledWith({ preventScroll: true });
      vi.useRealTimers();
      dispose();
    });

    it('handleToolbarKeyDown should ignore non-Escape keys', () => {
      const { controller, dispose, setExpanded } = createController();
      setExpanded(true);

      const event = {
        key: 'Enter',
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as KeyboardEvent;

      controller.handleToolbarKeyDown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(event.stopPropagation).not.toHaveBeenCalled();
      expect(mockSetSettingsExpanded).not.toHaveBeenCalled();
      dispose();
    });

    it('handleToolbarKeyDown should ignore Escape if settings are closed', () => {
      const { controller, dispose, setExpanded } = createController();
      setExpanded(false);

      const event = {
        key: 'Escape',
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as KeyboardEvent;

      controller.handleToolbarKeyDown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(event.stopPropagation).not.toHaveBeenCalled();
      dispose();
    });
  });

  describe('Outside Click Handling', () => {
    it('should close settings when clicking outside', () => {
      const { controller, dispose, setExpanded } = createController({
        documentRef: document,
      });
      setExpanded(true);

      // Mock elements
      const toolbar = document.createElement('div');
      const panel = document.createElement('div');
      const button = document.createElement('button');
      const outside = document.createElement('div');

      controller.assignToolbarRef(toolbar);
      controller.assignSettingsPanelRef(panel);
      controller.assignSettingsButtonRef(button);

      // Simulate click outside
      const event = new MouseEvent('mousedown', { bubbles: true });
      Object.defineProperty(event, 'target', { value: outside });
      document.dispatchEvent(event);

      expect(mockSetSettingsExpanded).toHaveBeenCalledWith(false);
      dispose();
    });

    it('should not close settings when clicking inside panel', () => {
      const { controller, dispose, setExpanded } = createController({
        documentRef: document,
      });
      setExpanded(true);

      const panel = document.createElement('div');
      controller.assignSettingsPanelRef(panel);

      const inside = document.createElement('div');
      panel.appendChild(inside);

      const event = new MouseEvent('mousedown', { bubbles: true });
      Object.defineProperty(event, 'target', { value: inside });
      document.dispatchEvent(event);

      expect(mockSetSettingsExpanded).not.toHaveBeenCalled();
      dispose();
    });

    it('should not close settings when clicking toolbar', () => {
      const { controller, dispose, setExpanded } = createController({
        documentRef: document,
      });
      setExpanded(true);

      const toolbar = document.createElement('div');
      controller.assignToolbarRef(toolbar);

      const event = new MouseEvent('mousedown', { bubbles: true });
      Object.defineProperty(event, 'target', { value: toolbar });
      document.dispatchEvent(event);

      expect(mockSetSettingsExpanded).not.toHaveBeenCalled();
      dispose();
    });

    it('should not close settings when clicking settings button', () => {
      const { controller, dispose, setExpanded } = createController({
        documentRef: document,
      });
      setExpanded(true);

      const button = document.createElement('button');
      controller.assignSettingsButtonRef(button);

      const event = new MouseEvent('mousedown', { bubbles: true });
      Object.defineProperty(event, 'target', { value: button });
      document.dispatchEvent(event);

      expect(mockSetSettingsExpanded).not.toHaveBeenCalled();
      dispose();
    });

    it('should not close settings when clicking a select element outside panel (e.g. portal)', () => {
      const { controller, dispose, setExpanded } = createController({
        documentRef: document,
      });
      setExpanded(true);

      const panel = document.createElement('div');
      controller.assignSettingsPanelRef(panel);

      const select = document.createElement('select');
      const option = document.createElement('option');
      select.appendChild(option);
      document.body.appendChild(select); // Outside panel

      const event = new MouseEvent('mousedown', { bubbles: true });
      Object.defineProperty(event, 'target', { value: option });
      document.dispatchEvent(event);

      expect(mockSetSettingsExpanded).not.toHaveBeenCalled();

      document.body.removeChild(select);
      dispose();
    });

    it('should remove event listeners on cleanup', () => {
      const { controller, dispose, setExpanded } = createController({
        documentRef: document,
      });
      setExpanded(true);

      const panel = document.createElement('div');
      controller.assignSettingsPanelRef(panel);

      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      dispose();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function), false);
    });
    it('should not close settings when clicking a select element directly outside panel', () => {
      const { controller, dispose, setExpanded } = createController({
        documentRef: document,
      });
      setExpanded(true);

      const panel = document.createElement('div');
      controller.assignSettingsPanelRef(panel);

      const select = document.createElement('select');
      document.body.appendChild(select); // Outside panel

      const event = new MouseEvent('mousedown', { bubbles: true });
      Object.defineProperty(event, 'target', { value: select });
      document.dispatchEvent(event);

      expect(mockSetSettingsExpanded).not.toHaveBeenCalled();

      document.body.removeChild(select);
      dispose();
    });
  });

  describe('Select Guard Logic', () => {
    it('should prevent closing when select is active via focus', () => {
      const { controller, dispose, setExpanded } = createController({
        documentRef: document,
      });
      setExpanded(true);

      const panel = document.createElement('div');
      const select = document.createElement('select');
      panel.appendChild(select);
      controller.assignSettingsPanelRef(panel);

      // Trigger effect to attach listeners
      // We need to manually trigger the focus listener attached in the effect
      // Since we can't easily access the internal listener, we rely on the DOM event
      select.dispatchEvent(new Event('focus'));

      // Simulate click outside
      const outside = document.createElement('div');
      const event = new MouseEvent('mousedown', { bubbles: true });
      Object.defineProperty(event, 'target', { value: outside });
      document.dispatchEvent(event);

      expect(mockSetSettingsExpanded).not.toHaveBeenCalled();
      dispose();
    });

    it('should allow closing after select blur and delay', () => {
      vi.useFakeTimers();
      const { controller, dispose, setExpanded } = createController({
        documentRef: document,
      });
      setExpanded(true);

      const panel = document.createElement('div');
      const select = document.createElement('select');
      panel.appendChild(select);
      controller.assignSettingsPanelRef(panel);

      // Focus then blur
      select.dispatchEvent(new Event('focus'));
      select.dispatchEvent(new Event('blur'));

      // Fast forward past the 100ms delay
      vi.advanceTimersByTime(150);

      // Simulate click outside
      const outside = document.createElement('div');
      const event = new MouseEvent('mousedown', { bubbles: true });
      Object.defineProperty(event, 'target', { value: outside });
      document.dispatchEvent(event);

      expect(mockSetSettingsExpanded).toHaveBeenCalledWith(false);

      vi.useRealTimers();
      dispose();
    });
  });

  describe('Error Handling', () => {
    it('getInitialTheme should handle error and return auto', () => {
      const errorThemeService = {
        ...mockThemeService,
        getCurrentTheme: vi.fn().mockImplementation(() => {
          throw new Error('Failed to get theme');
        }),
      };

      const { controller, dispose } = createController({
        themeService: errorThemeService,
      });

      expect(controller.currentTheme()).toBe('auto');
      dispose();
    });

    it('syncThemeFromService should handle error gracefully', () => {
      const errorThemeService = {
        ...mockThemeService,
        getCurrentTheme: vi.fn().mockImplementation(() => {
          throw new Error('Failed to sync theme');
        }),
      };

      // Should not throw
      const { dispose } = createController({
        themeService: errorThemeService,
      });
      dispose();
    });
  });

  describe('Internal Logic Coverage', () => {
    it('should not call clearTimeout when handle is null (handleSelectChange)', () => {
      const { controller, setExpanded } = createController();
      const mockPanel = document.createElement('div');
      const mockSelect = document.createElement('select');
      mockPanel.appendChild(mockSelect);

      controller.assignSettingsPanelRef(mockPanel);
      setExpanded(true); // This triggers the effect to attach listeners

      // Trigger change event
      mockSelect.dispatchEvent(new Event('change'));

      expect(globalTimerManager.clearTimeout).not.toHaveBeenCalled();
    });

    it('should call clearTimeout when handle is present (handleSelectChange)', () => {
      const { controller, setExpanded } = createController();
      const mockPanel = document.createElement('div');
      const mockSelect = document.createElement('select');
      mockPanel.appendChild(mockSelect);

      controller.assignSettingsPanelRef(mockPanel);
      setExpanded(true);

      // First change sets the timeout
      mockSelect.dispatchEvent(new Event('change'));

      // Second change should clear the previous one
      mockSelect.dispatchEvent(new Event('change'));

      expect(globalTimerManager.clearTimeout).toHaveBeenCalled();
    });

    it('should log warning when syncThemeFromService fails', () => {
      mockThemeService.getCurrentTheme = vi.fn().mockImplementation(() => {
        throw new Error('Service error');
      });

      createController(); // This triggers initialization which calls syncThemeFromService

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to read theme from service'),
        expect.any(Error)
      );
    });

    it('should not initialize theme service if already initialized', () => {
      mockThemeService.isInitialized = vi.fn().mockReturnValue(true);
      createController();
      expect(mockThemeService.initialize).not.toHaveBeenCalled();
    });

    it('should unsubscribe from services on cleanup', () => {
      const unsubscribeTheme = vi.fn();
      const unsubscribeLang = vi.fn();
      mockThemeService.onThemeChange = vi.fn().mockReturnValue(unsubscribeTheme);
      mockLanguageService.onLanguageChange = vi.fn().mockReturnValue(unsubscribeLang);

      const { dispose } = createController();
      dispose();

      expect(unsubscribeTheme).toHaveBeenCalled();
      expect(unsubscribeLang).toHaveBeenCalled();
    });

    it('should not try to focus if no focusable element found in settings', () => {
      vi.useFakeTimers();
      const { controller } = createController();
      const mockButton = document.createElement('button');
      const mockEvent = {
        target: mockButton,
        stopImmediatePropagation: vi.fn(),
      } as unknown as MouseEvent;

      // Mock querySelector to return a panel with NO focusable elements
      const mockPanel = document.createElement('div');
      mockPanel.querySelector = vi.fn().mockReturnValue(null); // No button/input found

      const originalQuerySelector = document.querySelector;
      document.querySelector = vi.fn().mockReturnValue(mockPanel);

      controller.handleSettingsClick(mockEvent);
      vi.runAllTimers();

      document.querySelector = originalQuerySelector;
      vi.useRealTimers();
      // Should not crash
    });
  });
});
