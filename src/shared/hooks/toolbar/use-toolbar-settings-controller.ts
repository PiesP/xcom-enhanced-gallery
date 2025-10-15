/**
 * @fileoverview Toolbar settings controller hook
 * @description Encapsulates settings panel toggling, outside click handling, and high contrast detection.
 */

import { logger } from '../../logging/logger';
import { getSolid } from '../../external/vendors';
import { ThemeService } from '../../services/theme-service';
import { LanguageService } from '../../services/language-service';
import { throttleScroll } from '../../utils/performance/performance-utils';
import { EventManager } from '../../services/event-manager';
import { globalTimerManager } from '../../utils/timer-management';
import type { ToolbarExpandableState } from '../../state/signals/toolbar.signals';
import {
  getToolbarExpandableState,
  setSettingsExpanded as defaultSetSettingsExpanded,
  toggleSettingsExpanded as defaultToggleSettingsExpanded,
} from '../../state/signals/toolbar.signals';

const DEFAULT_FOCUS_DELAY_MS = 50;
const DEFAULT_SELECT_GUARD_MS = 300;
const DEFAULT_HIGH_CONTRAST_OFFSETS = [0.25, 0.5, 0.75] as const;

type ThemeOption = 'auto' | 'light' | 'dark';
type LanguageOption = 'auto' | 'ko' | 'en' | 'ja';

type HighContrastEvaluatorInput = {
  readonly toolbar: HTMLElement;
  readonly documentRef: Document;
  readonly windowRef: Window;
  readonly offsets: ReadonlyArray<number>;
};

type HighContrastEvaluator = (input: HighContrastEvaluatorInput) => boolean;

type EventManagerLike = Pick<EventManager, 'addListener' | 'removeListener'>;

export interface UseToolbarSettingsControllerOptions {
  readonly setNeedsHighContrast: (enabled: boolean) => void;
  readonly getExpandableState?: () => ToolbarExpandableState;
  readonly setSettingsExpanded?: (expanded: boolean) => void;
  readonly toggleSettingsExpanded?: () => void;
  readonly documentRef?: Document;
  readonly windowRef?: Window;
  readonly eventManager?: EventManagerLike;
  readonly themeService?: ThemeService;
  readonly languageService?: LanguageService;
  readonly focusDelayMs?: number;
  readonly selectChangeGuardMs?: number;
  readonly highContrastOffsets?: ReadonlyArray<number>;
  readonly highContrastEvaluator?: HighContrastEvaluator;
  readonly scrollThrottle?: <T extends (...args: never[]) => void>(fn: T) => T;
}

export interface ToolbarSettingsControllerResult {
  readonly assignToolbarRef: (element: HTMLDivElement | null | undefined) => void;
  readonly assignSettingsPanelRef: (element: HTMLDivElement | null | undefined) => void;
  readonly assignSettingsButtonRef: (element: HTMLButtonElement | null | undefined) => void;
  readonly isSettingsExpanded: () => boolean;
  readonly currentTheme: () => ThemeOption;
  readonly currentLanguage: () => LanguageOption;
  readonly handleSettingsClick: (event: MouseEvent) => void;
  readonly handleSettingsMouseDown: (event: MouseEvent) => void;
  readonly handleToolbarKeyDown: (event: KeyboardEvent) => void;
  readonly handlePanelMouseDown: (event: MouseEvent) => void;
  readonly handlePanelClick: (event: MouseEvent) => void;
  readonly handleThemeChange: (event: Event) => void;
  readonly handleLanguageChange: (event: Event) => void;
}

type TimeoutHandle = number | ReturnType<typeof globalTimerManager.setTimeout>;

interface TimeoutControls {
  readonly schedule: (callback: () => void, delay: number) => TimeoutHandle;
  readonly clear: (id: TimeoutHandle | undefined) => void;
}

function createTimeoutControls(_windowRef: Window | undefined): TimeoutControls {
  return {
    schedule: (callback, delay) => {
      return globalTimerManager.setTimeout(callback, delay);
    },
    clear: id => {
      if (id === undefined) {
        return;
      }
      globalTimerManager.clearTimeout(id as number);
    },
  };
}

function defaultHighContrastEvaluator(input: HighContrastEvaluatorInput): boolean {
  const { toolbar, documentRef, windowRef, offsets } = input;

  if (typeof documentRef.elementsFromPoint !== 'function') {
    return false;
  }

  const rect = toolbar.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return false;
  }

  const lightHits = offsets.filter(offset => {
    const x = rect.left + rect.width * offset;
    const y = rect.top + rect.height * 0.5;
    const elements = documentRef.elementsFromPoint(x, y);
    return elements.some(element => {
      const bg = windowRef.getComputedStyle(element).backgroundColor || '';
      return /(?:white|255)/i.test(bg);
    });
  }).length;

  return lightHits >= 2;
}

export function useToolbarSettingsController(
  options: UseToolbarSettingsControllerOptions
): ToolbarSettingsControllerResult {
  const solid = getSolid();
  const { createSignal, createMemo, createEffect, onCleanup } = solid;

  const {
    setNeedsHighContrast,
    getExpandableState = getToolbarExpandableState,
    setSettingsExpanded = defaultSetSettingsExpanded,
    toggleSettingsExpanded = defaultToggleSettingsExpanded,
    documentRef = typeof document !== 'undefined' ? document : undefined,
    windowRef = typeof window !== 'undefined' ? window : undefined,
    eventManager = EventManager.getInstance(),
    themeService = new ThemeService(),
    languageService = new LanguageService(),
    focusDelayMs = DEFAULT_FOCUS_DELAY_MS,
    selectChangeGuardMs = DEFAULT_SELECT_GUARD_MS,
    highContrastOffsets = DEFAULT_HIGH_CONTRAST_OFFSETS,
    highContrastEvaluator = undefined,
    scrollThrottle = throttleScroll,
  } = options;

  const timeoutControls = createTimeoutControls(windowRef);

  const [toolbarRef, setToolbarRef] = createSignal<HTMLDivElement | undefined>(undefined);
  const [settingsPanelRef, setSettingsPanelRef] = createSignal<HTMLDivElement | undefined>(
    undefined
  );
  const [settingsButtonRef, setSettingsButtonRef] = createSignal<HTMLButtonElement | undefined>(
    undefined
  );

  const [currentTheme, setCurrentTheme] = createSignal<ThemeOption>('auto');
  const [currentLanguage, setCurrentLanguage] = createSignal<LanguageOption>('auto');

  const isSettingsExpanded = createMemo(() => getExpandableState().isSettingsExpanded);

  const evaluateHighContrast = () => {
    const toolbarElement = toolbarRef();
    if (!toolbarElement || !documentRef || !windowRef) {
      setNeedsHighContrast(false);
      return;
    }

    const shouldEnable =
      typeof highContrastEvaluator === 'function'
        ? Boolean(
            highContrastEvaluator({
              toolbar: toolbarElement,
              documentRef,
              windowRef,
              offsets: highContrastOffsets,
            })
          )
        : defaultHighContrastEvaluator({
            toolbar: toolbarElement,
            documentRef,
            windowRef,
            offsets: highContrastOffsets,
          });

    setNeedsHighContrast(shouldEnable);
  };

  createEffect(() => {
    if (!windowRef) {
      setNeedsHighContrast(false);
      return;
    }

    evaluateHighContrast();

    const detect = scrollThrottle(() => {
      if (typeof windowRef.requestAnimationFrame === 'function') {
        windowRef.requestAnimationFrame(evaluateHighContrast);
      } else {
        evaluateHighContrast();
      }
    });

    const listenerId = eventManager.addListener(windowRef, 'scroll', detect as EventListener, {
      passive: true,
    });

    onCleanup(() => {
      if (!listenerId) {
        return;
      }
      const removed = eventManager.removeListener(listenerId);
      if (!removed) {
        windowRef.removeEventListener('scroll', detect as EventListener);
      }
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

    logger.debug('[ToolbarSettingsController] Settings panel expanded');

    let isSelectActive = false;
    let selectGuardTimeout: TimeoutHandle | undefined;

    const handleSelectFocus = () => {
      isSelectActive = true;
      logger.debug('[ToolbarSettingsController] Select focused - enabling guard');
    };

    const handleSelectBlur = () => {
      timeoutControls.schedule(() => {
        isSelectActive = false;
        logger.debug('[ToolbarSettingsController] Select blur - guard disabled');
      }, 100);
    };

    const handleSelectChange = () => {
      logger.debug('[ToolbarSettingsController] Select change detected');
      isSelectActive = true;
      timeoutControls.clear(selectGuardTimeout);
      selectGuardTimeout = timeoutControls.schedule(() => {
        isSelectActive = false;
        logger.debug('[ToolbarSettingsController] Select change guard released');
        selectGuardTimeout = undefined;
      }, selectChangeGuardMs);
    };

    const selects = Array.from(panel.querySelectorAll('select'));
    selects.forEach(select => {
      select.addEventListener('focus', handleSelectFocus);
      select.addEventListener('blur', handleSelectBlur);
      select.addEventListener('change', handleSelectChange);
    });

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      const settingsButton = settingsButtonRef();

      logger.debug('[ToolbarSettingsController] Outside click detected', {
        tagName: target instanceof HTMLElement ? target.tagName : 'unknown',
        isSelectActive,
      });

      if (!target) {
        return;
      }

      if (isSelectActive) {
        logger.debug('[ToolbarSettingsController] Outside click ignored - select guard active');
        return;
      }

      const targetElement = target as HTMLElement;

      if (
        settingsButton &&
        (settingsButton === targetElement || settingsButton.contains(targetElement))
      ) {
        logger.debug('[ToolbarSettingsController] Outside click ignored - inside settings button');
        return;
      }

      if (panel.contains(targetElement)) {
        logger.debug('[ToolbarSettingsController] Outside click ignored - inside panel');
        return;
      }

      let currentNode: HTMLElement | null = targetElement;
      while (currentNode) {
        if (currentNode.tagName === 'SELECT' || currentNode.tagName === 'OPTION') {
          logger.debug('[ToolbarSettingsController] Outside click ignored - select hierarchy');
          return;
        }
        currentNode = currentNode.parentElement;
      }

      logger.debug('[ToolbarSettingsController] Closing settings panel via outside click');
      setSettingsExpanded(false);
    };

    documentRef.addEventListener('mousedown', handleOutsideClick, false);

    onCleanup(() => {
      timeoutControls.clear(selectGuardTimeout);
      documentRef.removeEventListener('mousedown', handleOutsideClick, false);
      selects.forEach(select => {
        select.removeEventListener('focus', handleSelectFocus);
        select.removeEventListener('blur', handleSelectBlur);
        select.removeEventListener('change', handleSelectChange);
      });
    });
  });

  const handleSettingsClick = (event: MouseEvent) => {
    logger.debug('[ToolbarSettingsController] Settings button click', {
      wasExpanded: isSettingsExpanded(),
      eventType: event.type,
      timeStamp: event.timeStamp,
    });

    event.stopImmediatePropagation?.();
    const wasExpanded = isSettingsExpanded();

    toggleSettingsExpanded();

    logger.debug('[ToolbarSettingsController] Settings toggled', {
      wasExpanded,
      nowExpanded: isSettingsExpanded(),
    });

    if (!wasExpanded) {
      timeoutControls.schedule(() => {
        const panel = settingsPanelRef();
        const firstControl = panel?.querySelector('select') as HTMLSelectElement | null;
        if (firstControl) {
          logger.debug('[ToolbarSettingsController] Focusing first settings control');
          firstControl.focus();
        }
      }, focusDelayMs);
    }
  };

  const handleSettingsMouseDown = (event: MouseEvent) => {
    logger.debug('[ToolbarSettingsController] Settings button mousedown');
    event.stopPropagation();
  };

  const handleToolbarKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isSettingsExpanded()) {
      event.preventDefault();
      event.stopPropagation();
      logger.debug('[ToolbarSettingsController] Escape pressed - closing settings panel');
      setSettingsExpanded(false);

      timeoutControls.schedule(() => {
        const settingsButton = settingsButtonRef();
        if (settingsButton) {
          settingsButton.focus();
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
    const theme = (select.value as ThemeOption) || 'auto';
    setCurrentTheme(theme);
    themeService.setTheme(theme);
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
    assignToolbarRef: element => {
      setToolbarRef(element ?? undefined);
    },
    assignSettingsPanelRef: element => {
      setSettingsPanelRef(element ?? undefined);
    },
    assignSettingsButtonRef: element => {
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
