/**
 * @fileoverview Toolbar Settings Controller Hook - Phase 375
 * @description Manages settings panel toggling, outside click handling, and localized options
 *
 * **Responsibilities**:
 * - Settings panel show/hide toggling with document outside-click detection
 * - Theme selection (auto/light/dark) with persistence via ThemeService
 * - Language selection (auto/ko/en/ja) with persistence via LanguageService
 * - Focus management (auto-focus first control, restore on close)
 * - Select element guard (prevents closing on select dropdown interactions)
 *
 * **Event Management**:
 * - Uses EventManager (Phase 329) for listener registration
 * - Proper cleanup via onCleanup in createEffect blocks (Solid.js)
 * - Outside click detection via document mousedown (not click)
 *
 * **Service Integration**:
 * - ThemeService: Theme persistence (auto/light/dark)
 * - LanguageService: Language persistence (auto/ko/en/ja)
 * - EventManager: Centralized event listener tracking
 *
 * @version 11.0.0 - Phase 375
 * @internal Solid.js hook, PC-only, used by toolbar container
 */

import {
  getLanguageService,
  getThemeService,
  tryGetSettingsManager,
} from '@shared/container/service-accessors';
import { logger } from '@shared/logging/logger';
import { EventManager } from '@shared/services/event-manager';
import { globalTimerManager } from '@shared/utils/time/timer-management';
import { createEffect, createSignal, onCleanup } from 'solid-js';

import type {
  LanguageOption,
  ThemeOption,
  ToolbarSettingsControllerResult,
  UseToolbarSettingsControllerOptions,
} from './use-toolbar-settings-controller.types';

let toolbarSettingsControllerListenerSeq = 0;

const DEFAULTS = {
  FOCUS_DELAY_MS: 50,
  SELECT_GUARD_MS: 300,
} as const;

export type { LanguageOption, ThemeOption };
export type {
  ToolbarSettingsControllerResult,
  UseToolbarSettingsControllerOptions,
} from './use-toolbar-settings-controller.types';

export function useToolbarSettingsController(
  options: UseToolbarSettingsControllerOptions
): ToolbarSettingsControllerResult {
  /**
   * Toolbar Settings Controller Implementation
   *
   * **Core Features**:
   *
   * 1. **Settings Panel Management** - Toggle with outside-click detection
   *    - Click settings button to toggle panel
   *    - Panel closes on document mousedown (outside click)
   *    - Panel closes on Escape key
   *    - Focus restored to button on close
   *
   * 2. **Select Guard System** - Prevents premature panel closure
   *    - Detects select element interactions (focus/blur/change)
   *    - Keeps panel open during select dropdown
   *    - Guard timeout: 300ms (configurable)
   *
   * 3. **Theme Selection** - 'auto' | 'light' | 'dark'
   *    - Persisted via ThemeService
   *    - Reactive to service changes
   *    - Updates DOM via CSS class binding
   *
   * 4. **Language Selection** - 'auto' | 'ko' | 'en' | 'ja'
   *    - Persisted via LanguageService
   *    - Reactive to service changes
   *    - Affects UI language immediately
   *
   * **Event Flow**:
   * Settings Click → Toggle Panel
   *   ↓ (if opening)
   * Focus First Select (50ms delay)
   *   ↓
   * Outside Click → Check Guard/Panel → Close if valid
   *
   * **Usage Example**:
   * ```typescript
   * const controller = useToolbarSettingsController({
   *   isSettingsExpanded: () => expanded(),
   *   setSettingsExpanded: setExpanded,
   *   toggleSettingsExpanded: () => setExpanded(e => !e),
   * });
   *
   * <div ref={controller.assignToolbarRef} onKeyDown={controller.handleToolbarKeyDown}>
   *   <button onClick={controller.handleSettingsClick}>Settings</button>
   *   <div ref={controller.assignSettingsPanelRef} onClick={controller.handlePanelClick}>
   *     <select onChange={controller.handleThemeChange}>...</select>
   *   </div>
   * </div>
   * ```
   *
   * @param options - Configuration (see UseToolbarSettingsControllerOptions)
   * @returns Controller with ref assigners and event handlers
   * @internal Phase 375: Solid.js hook, PC-only
   */
  const {
    isSettingsExpanded,
    setSettingsExpanded,
    toggleSettingsExpanded,
    documentRef = typeof document !== 'undefined' ? document : undefined,
    themeService: providedThemeService,
    languageService: providedLanguageService,
    focusDelayMs = DEFAULTS.FOCUS_DELAY_MS,
    selectChangeGuardMs = DEFAULTS.SELECT_GUARD_MS,
  } = options;

  const themeManager = providedThemeService ?? getThemeService();
  const languageService = providedLanguageService ?? getLanguageService();

  const scheduleTimeout = (callback: () => void, delay: number): number => {
    return globalTimerManager.setTimeout(callback, delay);
  };

  const clearScheduledTimeout = (handle: number | null | undefined): void => {
    if (handle == null) {
      return;
    }
    globalTimerManager.clearTimeout(handle);
  };

  const [toolbarRef, setToolbarRef] = createSignal<HTMLDivElement | undefined>(undefined);
  const [settingsPanelRef, setSettingsPanelRef] = createSignal<HTMLDivElement | undefined>(
    undefined
  );
  const [settingsButtonRef, setSettingsButtonRef] = createSignal<HTMLButtonElement | undefined>(
    undefined
  );

  const toThemeOption = (value: unknown): ThemeOption => {
    return value === 'light' || value === 'dark' ? value : 'auto';
  };

  // Phase 430: Read initial theme from ThemeService reliably
  // Service may not be fully initialized during first render, so we ensure proper fallback
  const getInitialTheme = (): ThemeOption => {
    try {
      // ThemeService.getCurrentTheme() returns themeSetting which is set in constructor
      // This should be available even before full initialization
      const currentSetting = themeManager.getCurrentTheme();
      return toThemeOption(currentSetting);
    } catch (error) {
      if (__DEV__) {
        logger.debug('[ToolbarSettingsController] Failed to read initial theme', error);
      }
    }
    return 'auto';
  };

  const [currentTheme, setCurrentTheme] = createSignal<ThemeOption>(getInitialTheme());
  const [currentLanguage, setCurrentLanguage] = createSignal<LanguageOption>(
    languageService.getCurrentLanguage() as LanguageOption
  );

  const syncThemeFromService = () => {
    try {
      const setting = themeManager.getCurrentTheme();
      setCurrentTheme(toThemeOption(setting));
    } catch (error) {
      logger.warn('[ToolbarSettingsController] Failed to read theme from service', error);
    }
  };

  syncThemeFromService();

  if (typeof themeManager.isInitialized === 'function' && !themeManager.isInitialized()) {
    void themeManager
      .initialize()
      .then(syncThemeFromService)
      .catch((error) => {
        logger.warn('[ToolbarSettingsController] ThemeService initialization failed', error);
      });
  }

  createEffect(() => {
    const unsubscribe = themeManager.onThemeChange((_, setting) => {
      setCurrentTheme(toThemeOption(setting));
    });

    onCleanup(() => {
      unsubscribe?.();
    });
  });

  createEffect(() => {
    const unsubscribe = languageService.onLanguageChange((next) => {
      setCurrentLanguage(next);
    });

    onCleanup(() => {
      unsubscribe();
    });
  });

  createEffect(() => {
    if (!documentRef) {
      return;
    }

    const expanded = isSettingsExpanded();
    const panel = settingsPanelRef();

    if (!expanded || !panel) {
      return;
    }

    const eventManager = EventManager.getInstance();
    const listenerContext = `toolbar-settings-controller:${toolbarSettingsControllerListenerSeq++}`;

    let isSelectActive = false;
    let selectGuardTimeout: number | null = null;

    const handleSelectFocus = () => {
      isSelectActive = true;
    };

    const handleSelectBlur = () => {
      scheduleTimeout(() => {
        isSelectActive = false;
      }, 100);
    };

    const handleSelectChange = () => {
      isSelectActive = true;
      clearScheduledTimeout(selectGuardTimeout);
      selectGuardTimeout = scheduleTimeout(() => {
        isSelectActive = false;
        selectGuardTimeout = null;
      }, selectChangeGuardMs);
    };

    const selects = Array.from(panel.querySelectorAll('select'));
    selects.forEach((select) => {
      eventManager.addListener(select, 'focus', handleSelectFocus, undefined, listenerContext);
      eventManager.addListener(select, 'blur', handleSelectBlur, undefined, listenerContext);
      eventManager.addListener(select, 'change', handleSelectChange, undefined, listenerContext);
    });

    const handleOutsideClick = (event: Event) => {
      const target = (event as MouseEvent).target as Node | null;
      const settingsButton = settingsButtonRef();
      const toolbarElement = toolbarRef();

      if (!target) {
        return;
      }

      if (isSelectActive) {
        return;
      }

      const targetElement = target as HTMLElement;

      if (toolbarElement?.contains(targetElement)) {
        return;
      }

      if (settingsButton?.contains(targetElement)) {
        return;
      }

      if (panel.contains(targetElement)) {
        return;
      }

      let currentNode: HTMLElement | null = targetElement;
      while (currentNode) {
        if (currentNode.tagName === 'SELECT' || currentNode.tagName === 'OPTION') {
          return;
        }
        currentNode = currentNode.parentElement;
      }

      setSettingsExpanded(false);
    };

    eventManager.addListener(
      documentRef,
      'mousedown',
      handleOutsideClick as EventListener,
      { capture: false },
      listenerContext
    );

    onCleanup(() => {
      clearScheduledTimeout(selectGuardTimeout);
      eventManager.removeByContext(listenerContext);
    });
  });

  const handleSettingsClick = (event: MouseEvent) => {
    event.stopImmediatePropagation?.();
    const wasExpanded = isSettingsExpanded();

    toggleSettingsExpanded();

    if (!wasExpanded) {
      scheduleTimeout(() => {
        const panel = settingsPanelRef();
        const firstControl = panel?.querySelector('select') as HTMLSelectElement | null;
        if (firstControl) {
          firstControl.focus({ preventScroll: true });
        }
      }, focusDelayMs);
    }
  };

  const handleSettingsMouseDown = (event: MouseEvent) => {
    event.stopPropagation();
  };

  const handleToolbarKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isSettingsExpanded()) {
      event.preventDefault();
      event.stopPropagation();
      setSettingsExpanded(false);

      scheduleTimeout(() => {
        const settingsButton = settingsButtonRef();
        if (settingsButton) {
          settingsButton.focus({ preventScroll: true });
        }
      }, focusDelayMs);
    }
  };

  const handlePanelMouseDown = (event: MouseEvent) => {
    event.stopPropagation();
  };

  const handlePanelClick = (event: MouseEvent) => {
    event.stopPropagation();
  };

  const handleThemeChange = (event: Event) => {
    const select = event.target as HTMLSelectElement | null;
    if (!select) {
      return;
    }
    const theme = toThemeOption(select.value);
    setCurrentTheme(theme);
    themeManager.setTheme(theme);

    // Sync theme to SettingsService if available (fixes auto theme override on restart)
    try {
      const settingsService = tryGetSettingsManager<{
        set: (key: string, value: unknown) => Promise<void>;
      }>();
      if (settingsService) {
        void settingsService.set('gallery.theme', theme).catch((error: unknown) => {
          logger.warn(
            '[ToolbarSettingsController] Failed to sync theme to SettingsService:',
            error
          );
        });
      }
    } catch (error) {
      logger.debug(
        '[ToolbarSettingsController] SettingsService not available for theme sync:',
        error
      );
    }
  };

  const handleLanguageChange = (event: Event) => {
    const select = event.target as HTMLSelectElement | null;
    if (!select) {
      return;
    }
    const language = (select.value as LanguageOption) || 'auto';
    setCurrentLanguage(language);
    languageService.setLanguage(language);
  };

  return {
    assignToolbarRef: (element) => {
      setToolbarRef(element ?? undefined);
    },
    assignSettingsPanelRef: (element) => {
      setSettingsPanelRef(element ?? undefined);
    },
    assignSettingsButtonRef: (element) => {
      setSettingsButtonRef(element ?? undefined);
    },
    isSettingsExpanded,
    currentTheme,
    currentLanguage,
    handleSettingsClick,
    handleSettingsMouseDown,
    handleToolbarKeyDown,
    handlePanelMouseDown,
    handlePanelClick,
    handleThemeChange,
    handleLanguageChange,
  };
}
