/**
 * @fileoverview SettingsModal - Solid.js implementation
 * @description Unified settings modal supporting panel and modal display modes with Solid primitives.
 */
import { getSolid, type ComponentChildren, type JSXElement } from '../../../external/vendors';
import { ComponentStandards } from '../StandardProps';
import { IconButton } from '../Button/IconButton';
import { X } from '../Icon';
import { LanguageService } from '../../../services/language-service';
import { ThemeService } from '../../../services/theme-service';
import { useFocusTrap } from '../../../hooks/use-focus-trap';
import { useScrollLock } from '../../../hooks/use-scroll-lock';
import { useModalPosition } from '../../../hooks/use-modal-position';
import { useSettingsModal } from '../../../hooks/use-settings-modal';
import { globalTimerManager } from '../../../utils/timer-management';
import toolbarStyles from '../Toolbar/Toolbar.module.css';
import styles from './SettingsModal.module.css';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'panel' | 'modal';
  position?: 'toolbar-below' | 'top-right' | 'center' | 'bottom-sheet';
  children?: ComponentChildren;
  className?: string;
  'data-testid'?: string;
}

type PositionKey = NonNullable<SettingsModalProps['position']>;

const POSITION_CLASS: Record<PositionKey, string> = {
  'toolbar-below': styles.toolbarBelow || '',
  'top-right': styles.topRight || '',
  center: styles.center || '',
  'bottom-sheet': styles.bottomSheet || '',
};

export function SettingsModal(props: SettingsModalProps): JSXElement | null {
  const { createSignal, createEffect, onCleanup, createMemo } = getSolid();

  const themeService = new ThemeService();
  const languageService = new LanguageService();

  // Use headless settings hook for state management
  const { currentTheme, currentLanguage, handleThemeChange, handleLanguageChange } =
    useSettingsModal({
      themeService,
      languageService,
      onThemeChange: theme => {
        // Apply theme to DOM
        if (typeof document !== 'undefined') {
          if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
          } else {
            document.documentElement.setAttribute('data-theme', theme);
          }
        }
      },
    });

  const [getPanelElement, setPanelElement] = createSignal<HTMLDivElement | null>(null);
  const [getContainerElement, setContainerElement] = createSignal<HTMLDivElement | null>(null);
  const [getBackdropElement, setBackdropElement] = createSignal<HTMLDivElement | null>(null);
  const [getCloseButtonElement, setCloseButtonElement] = createSignal<HTMLButtonElement | null>(
    null
  );

  let ignoreCloseInvocation = false;
  let previouslyFocusedElement: HTMLElement | null = null;
  let focusTimerId: number | null = null;

  const mode = createMemo(() => props.mode ?? 'modal');
  const isPanel = () => mode() === 'panel';
  const position = createMemo(() => props.position ?? 'center');
  const className = () => props.className ?? '';
  const testProps = ComponentStandards.createTestProps(props['data-testid']);

  // Dynamic positioning for modal mode with toolbar-below
  const shouldUseDynamicPosition = () => !isPanel() && position() === 'toolbar-below';
  const toolbarElement = () =>
    shouldUseDynamicPosition() ? (document.getElementById('xeg-toolbar') ?? null) : null;

  // Calculate modal size (approximate, can be refined with actual measurements)
  const MODAL_SIZE = { width: 448, height: 300 }; // 28em width, ~300px height

  const dynamicPosition = useModalPosition({
    toolbarRef: toolbarElement(),
    modalSize: MODAL_SIZE,
    margin: 16,
    centerHorizontally: true,
  });

  const invokeOnClose = () => {
    if (typeof props.onClose !== 'function') {
      return;
    }

    if (ignoreCloseInvocation) {
      ignoreCloseInvocation = false;
      return;
    }

    props.onClose();
  };

  const scheduleIgnoreReset = () => {
    globalTimerManager.setTimeout(() => {
      ignoreCloseInvocation = false;
    }, 0);
  };

  useScrollLock(() => ({
    enabled: props.isOpen && !isPanel(),
    reserveScrollBarGap: true,
  }));

  useFocusTrap(
    () => getContainerElement() ?? getPanelElement(),
    () => props.isOpen && !isPanel(),
    {
      onEscape: () => {
        invokeOnClose();
      },
      restoreFocus: false,
    }
  );

  createEffect(() => {
    if (!props.isOpen) {
      return;
    }

    previouslyFocusedElement = (document.activeElement as HTMLElement | null) ?? null;

    const container = getContainerElement() ?? getPanelElement();
    if (!container) {
      return;
    }

    focusTimerId = globalTimerManager.setTimeout(() => {
      const focusTarget =
        getCloseButtonElement() ??
        container.querySelector<HTMLElement>(
          '[data-initial-focus], button:not([disabled]), [href], select, [tabindex]:not([tabindex="-1")]'
        );

      try {
        focusTarget?.focus();
      } catch {
        /* ignore focus errors */
      }
    }, 0);

    onCleanup(() => {
      if (focusTimerId) {
        globalTimerManager.clearTimeout(focusTimerId);
        focusTimerId = null;
      }
    });
  });

  createEffect(() => {
    if (props.isOpen) return;

    const previous = previouslyFocusedElement;
    if (!previous) return;

    globalTimerManager.setTimeout(() => {
      try {
        previous.focus();
      } catch {
        /* ignore focus errors */
      }
    }, 0);
    previouslyFocusedElement = null;
  });

  createEffect(() => {
    const button = getCloseButtonElement();
    if (!button) {
      return;
    }

    const handleButtonClick = (event: MouseEvent) => {
      event.stopPropagation();
      invokeOnClose();
    };

    button.addEventListener('click', handleButtonClick);
    onCleanup(() => button.removeEventListener('click', handleButtonClick));
  });

  createEffect(() => {
    const panel = getPanelElement();
    if (!panel || !props.isOpen || !isPanel()) {
      return;
    }

    const handlePanelClick = (event: MouseEvent) => {
      if (event.target !== panel) {
        return;
      }
      invokeOnClose();
    };

    panel.addEventListener('click', handlePanelClick);
    onCleanup(() => panel.removeEventListener('click', handlePanelClick));
  });

  createEffect(() => {
    const container = getContainerElement();
    if (!container || !props.isOpen || isPanel()) {
      return;
    }

    const handleCapture = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (target && getCloseButtonElement()?.contains(target)) {
        return;
      }

      ignoreCloseInvocation = true;
      scheduleIgnoreReset();
    };

    const stopPropagation = (event: MouseEvent) => {
      event.stopPropagation();
    };

    container.addEventListener('click', handleCapture, true);
    container.addEventListener('click', stopPropagation);

    onCleanup(() => {
      container.removeEventListener('click', handleCapture, true);
      container.removeEventListener('click', stopPropagation);
    });
  });

  createEffect(() => {
    const backdrop = getBackdropElement();
    const container = getContainerElement();
    if (!backdrop || !container || !props.isOpen || isPanel()) {
      return;
    }

    const handleBackdropClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (target && container.contains(target)) {
        return;
      }

      if (typeof event.composedPath === 'function') {
        const path = event.composedPath();
        if (Array.isArray(path) && path.includes(container)) {
          return;
        }
      }

      invokeOnClose();
    };

    backdrop.addEventListener('click', handleBackdropClick);
    onCleanup(() => backdrop.removeEventListener('click', handleBackdropClick));
  });

  if (!props.isOpen) {
    return null;
  }

  const containerClass = ComponentStandards.createClassName(
    styles.panel,
    POSITION_CLASS[position()],
    className()
  );

  const innerClass = ComponentStandards.createClassName(styles.modal, styles.inner);

  const header = (
    <div class={`${styles.header} xeg-row-center xeg-center-between xeg-gap-md`}>
      <h2 id='settings-title' class={styles.title}>
        {languageService.getString('settings.title')}
      </h2>
      <IconButton
        ref={element => setCloseButtonElement(element ?? null)}
        className={`${styles.closeButton || ''} xeg-size-toolbar`}
        size='md'
        aria-label={languageService.getString('toolbar.close')}
        data-initial-focus='true'
      >
        <X size={16} />
      </IconButton>
    </div>
  );

  const themeSelect = (
    <select
      id='theme-select'
      class={`${toolbarStyles.toolbarButton} ${styles.select}`}
      value={currentTheme()}
      onChange={handleThemeChange}
    >
      <option value='auto'>{languageService.getString('settings.themeAuto')}</option>
      <option value='light'>{languageService.getString('settings.themeLight')}</option>
      <option value='dark'>{languageService.getString('settings.themeDark')}</option>
    </select>
  );

  const languageSelect = (
    <select
      id='language-select'
      class={`${toolbarStyles.toolbarButton} ${styles.select}`}
      value={currentLanguage()}
      onChange={handleLanguageChange}
    >
      <option value='auto'>자동 / Auto / 自動</option>
      <option value='ko'>한국어</option>
      <option value='en'>English</option>
      <option value='ja'>日本語</option>
    </select>
  );

  const defaultBody = (
    <div class={styles.body}>
      <div class={styles.setting}>
        <label for='theme-select' class={styles.label}>
          {languageService.getString('settings.theme')}
        </label>
        {themeSelect}
      </div>
      <div class={styles.setting}>
        <label for='language-select' class={styles.label}>
          {languageService.getString('settings.language')}
        </label>
        {languageSelect}
      </div>
    </div>
  );

  const handleContentClick = (event: MouseEvent) => {
    event.stopPropagation();
  };

  const content = (
    <div id='settings-content' class={innerClass} onClick={handleContentClick}>
      {header}
      {props.children ?? defaultBody}
    </div>
  );

  if (isPanel()) {
    return (
      <div
        ref={element => setPanelElement(element ?? null)}
        class={containerClass}
        role='dialog'
        aria-modal='true'
        aria-labelledby='settings-title'
        aria-describedby='settings-content'
        data-position={position()}
        {...testProps}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      ref={element => setBackdropElement(element ?? null)}
      class='settings-modal-backdrop'
      role='dialog'
      aria-modal='true'
      aria-labelledby='settings-title'
      aria-describedby='settings-content'
      {...testProps}
    >
      <div
        ref={element => setContainerElement(element ?? null)}
        class={containerClass}
        data-position={position()}
        role='document'
        style={
          shouldUseDynamicPosition()
            ? {
                position: 'fixed',
                top: `${dynamicPosition().top}px`,
                left: `${dynamicPosition().left}px`,
                transform: 'none',
              }
            : undefined
        }
      >
        {content}
      </div>
    </div>
  );
}

export default SettingsModal;
