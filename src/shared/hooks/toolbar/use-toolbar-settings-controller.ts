/**
 * @fileoverview Toolbar settings controller hook for settings panel management
 * @description Manages settings panel toggling, outside click handling, and localized options
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
   * Settings panel management hook
   * Handles toggling, outside-click detection, theme/language selection, and focus management
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

  // Read initial theme from ThemeService (with fallback)
  const getInitialTheme = (): ThemeOption => {
    try {
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
