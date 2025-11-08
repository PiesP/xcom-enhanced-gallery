/**
 * @fileoverview Toolbar Settings Controller Hook - Phase 375
 * @description Manages settings panel toggling, outside click handling, and high-contrast detection
 *
 * **Responsibilities**:
 * - Settings panel show/hide toggling with document outside-click detection
 * - Theme selection (auto/light/dark) with persistence via ThemeService
 * - Language selection (auto/ko/en/ja) with persistence via LanguageService
 * - High-contrast detection during scroll (accessibility feature)
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

import { logger } from '@shared/logging';
import { getSolid } from '../../external/vendors';
import { ThemeService } from '../../services/theme-service';
import {
  LanguageService,
  languageService as sharedLanguageService,
} from '../../services/language-service';
import { throttleScroll } from '../../utils/performance/performance-utils';
import { EventManager } from '../../services/event-manager';
import { globalTimerManager } from '../../utils/timer-management';
import { evaluateHighContrast } from '../../utils/high-contrast';
import { getThemeService } from '../../container/service-accessors';

const DEFAULT_FOCUS_DELAY_MS = 50;
const DEFAULT_SELECT_GUARD_MS = 300;
const DEFAULT_HIGH_CONTRAST_OFFSETS = [0.25, 0.5, 0.75] as const;

type ThemeOption = 'auto' | 'light' | 'dark';
type LanguageOption = 'auto' | 'ko' | 'en' | 'ja';

/** Event manager interface subset */
type EventManagerLike = Pick<EventManager, 'addListener' | 'removeListener'>;

export interface UseToolbarSettingsControllerOptions {
  readonly setNeedsHighContrast: (enabled: boolean) => void;
  readonly isSettingsExpanded: () => boolean;
  readonly setSettingsExpanded: (expanded: boolean) => void;
  readonly toggleSettingsExpanded: () => void;
  readonly documentRef?: Document;
  readonly windowRef?: Window;
  readonly eventManager?: EventManagerLike;
  readonly themeService?: ThemeService;
  readonly languageService?: LanguageService;
  readonly focusDelayMs?: number;
  readonly selectChangeGuardMs?: number;
  readonly highContrastOffsets?: ReadonlyArray<number>;
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

function resolveThemeService(override?: ThemeService): ThemeService {
  if (override) {
    return override;
  }

  try {
    return getThemeService();
  } catch (error) {
    logger.warn('[ToolbarSettingsController] Falling back to direct ThemeService instance', error);
    return new ThemeService();
  }
}

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
   * 5. **High-Contrast Mode** - Accessibility feature
   *    - Samples toolbar luminance at scroll events
   *    - Throttled via requestAnimationFrame
   *    - Sets CSS class for high-contrast CSS
   *    - Improves readability on low-contrast backgrounds
   *
   * **Event Flow**:
   * Settings Click → Toggle Panel
   *   ↓ (if opening)
   * Focus First Select (50ms delay)
   *   ↓
   * Scroll → High-Contrast Check (throttled)
   *   ↓
   * Outside Click → Check Guard/Panel → Close if valid
   *
   * **Usage Example**:
   * ```typescript
   * const controller = useToolbarSettingsController({
   *   setNeedsHighContrast: setHighContrast,
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
  const solid = getSolid();
  const { createSignal, createEffect, onCleanup } = solid;

  const {
    setNeedsHighContrast,
    isSettingsExpanded,
    setSettingsExpanded,
    toggleSettingsExpanded,
    documentRef = typeof document !== 'undefined' ? document : undefined,
    windowRef = typeof window !== 'undefined' ? window : undefined,
    eventManager = EventManager.getInstance(),
    themeService: providedThemeService,
    languageService = sharedLanguageService,
    focusDelayMs = DEFAULT_FOCUS_DELAY_MS,
    selectChangeGuardMs = DEFAULT_SELECT_GUARD_MS,
    highContrastOffsets = DEFAULT_HIGH_CONTRAST_OFFSETS,
    scrollThrottle = throttleScroll,
  } = options;

  const themeManager = resolveThemeService(providedThemeService);
  const timeoutControls = createTimeoutControls(windowRef);

  const [toolbarRef, setToolbarRef] = createSignal<HTMLDivElement | undefined>(undefined);
  const [settingsPanelRef, setSettingsPanelRef] = createSignal<HTMLDivElement | undefined>(
    undefined
  );
  const [settingsButtonRef, setSettingsButtonRef] = createSignal<HTMLButtonElement | undefined>(
    undefined
  );

  const [currentTheme, setCurrentTheme] = createSignal<ThemeOption>('auto');
  const [currentLanguage, setCurrentLanguage] = createSignal<LanguageOption>(
    languageService.getCurrentLanguage() as LanguageOption
  );

  const toThemeOption = (value: unknown): ThemeOption => {
    return value === 'light' || value === 'dark' || value === 'auto' ? value : 'auto';
  };

  const syncThemeFromService = () => {
    try {
      const setting = themeManager.getCurrentTheme();
      setCurrentTheme(toThemeOption(setting));
    } catch (error) {
      logger.debug('[ToolbarSettingsController] Failed to read theme from service', error);
    }
  };

  syncThemeFromService();

  if (typeof themeManager.isInitialized === 'function' && !themeManager.isInitialized()) {
    void themeManager
      .initialize()
      .then(syncThemeFromService)
      .catch(error => {
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
    const unsubscribe = languageService.onLanguageChange(next => {
      setCurrentLanguage(next);
    });

    onCleanup(() => {
      unsubscribe();
    });
  });

  const checkHighContrast = () => {
    const toolbarElement = toolbarRef();
    if (!toolbarElement || !documentRef || !windowRef) {
      setNeedsHighContrast(false);
      return;
    }

    const shouldEnable = evaluateHighContrast({
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

    checkHighContrast();

    const detect = scrollThrottle(() => {
      if (typeof windowRef.requestAnimationFrame === 'function') {
        windowRef.requestAnimationFrame(() => checkHighContrast());
      } else {
        checkHighContrast();
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
          firstControl.focus({ preventScroll: true });
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
