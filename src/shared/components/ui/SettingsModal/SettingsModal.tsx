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

type ThemeOption = 'auto' | 'light' | 'dark';
type LanguageOption = 'auto' | 'ko' | 'en' | 'ja';

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

  const [currentTheme, setCurrentTheme] = createSignal<ThemeOption>('auto');
  const [currentLanguage, setCurrentLanguage] = createSignal<LanguageOption>('auto');
  const [getPanelElement, setPanelElement] = createSignal<HTMLDivElement | null>(null);
  const [getContainerElement, setContainerElement] = createSignal<HTMLDivElement | null>(null);

  let panelElement: HTMLDivElement | null = null;
  let modalBackdropElement: HTMLDivElement | null = null;
  let modalContainerElement: HTMLDivElement | null = null;
  let closeButtonElement: HTMLButtonElement | null = null;
  let ignoreCloseInvocation = false;
  let removeContainerListeners: (() => void) | null = null;
  let removeBackdropListener: (() => void) | null = null;
  let removePanelListener: (() => void) | null = null;
  let removeCloseButtonListener: (() => void) | null = null;
  let previouslyFocusedElement: HTMLElement | null = null;
  let focusTimerId: number | null = null;

  const mode = createMemo(() => props.mode ?? 'modal');
  const isPanel = () => mode() === 'panel';
  const position = createMemo(() => props.position ?? 'center');
  const className = () => props.className ?? '';
  const testProps = ComponentStandards.createTestProps(props['data-testid']);

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
    () => modalContainerElement ?? panelElement,
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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        invokeOnClose();
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    focusTimerId = globalTimerManager.setTimeout(() => {
      const focusTarget =
        closeButtonElement ??
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
      container.removeEventListener('keydown', handleKeyDown);

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

  const handleThemeChange = (event: Event) => {
    const nextTheme = (event.currentTarget as HTMLSelectElement).value as ThemeOption;
    setCurrentTheme(nextTheme);
    themeService.setTheme(nextTheme);

    if (typeof document !== 'undefined') {
      if (nextTheme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      } else {
        document.documentElement.setAttribute('data-theme', nextTheme);
      }
    }
  };

  const handleLanguageChange = (event: Event) => {
    const nextLanguage = (event.currentTarget as HTMLSelectElement).value as LanguageOption;
    setCurrentLanguage(nextLanguage);
    languageService.setLanguage(nextLanguage);
  };

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
        ref={element => {
          if (closeButtonElement === element) {
            return;
          }

          removeCloseButtonListener?.();
          removeCloseButtonListener = null;

          closeButtonElement = element;

          if (!closeButtonElement) {
            return;
          }

          const handleButtonClick = (event: MouseEvent) => {
            event.stopPropagation();
            invokeOnClose();
          };

          closeButtonElement.addEventListener('click', handleButtonClick);

          removeCloseButtonListener = () => {
            closeButtonElement?.removeEventListener('click', handleButtonClick);
          };

          onCleanup(() => {
            removeCloseButtonListener?.();
            removeCloseButtonListener = null;
          });
        }}
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
        ref={element => {
          if (panelElement === element) {
            return;
          }

          removePanelListener?.();
          removePanelListener = null;

          panelElement = element;
          setPanelElement(element ?? null);

          if (!panelElement) {
            return;
          }

          const handlePanelClick = (event: MouseEvent) => {
            if (event.target !== panelElement) {
              return;
            }
            invokeOnClose();
          };

          panelElement.addEventListener('click', handlePanelClick);

          removePanelListener = () => {
            panelElement?.removeEventListener('click', handlePanelClick);
          };

          onCleanup(() => {
            removePanelListener?.();
            removePanelListener = null;
          });
        }}
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
      ref={element => {
        if (modalBackdropElement === element) {
          return;
        }

        removeBackdropListener?.();
        removeBackdropListener = null;

        modalBackdropElement = element;

        if (!modalBackdropElement || isPanel()) {
          return;
        }

        const handleBackdropClick = (event: MouseEvent) => {
          const container = modalContainerElement;
          if (!container) {
            return;
          }

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

        modalBackdropElement.addEventListener('click', handleBackdropClick);

        removeBackdropListener = () => {
          modalBackdropElement?.removeEventListener('click', handleBackdropClick);
        };

        onCleanup(() => {
          removeBackdropListener?.();
          removeBackdropListener = null;
        });
      }}
      class='settings-modal-backdrop'
      role='dialog'
      aria-modal='true'
      aria-labelledby='settings-title'
      aria-describedby='settings-content'
      {...testProps}
    >
      <div
        ref={element => {
          if (modalContainerElement === element) {
            return;
          }

          removeContainerListeners?.();
          removeContainerListeners = null;

          modalContainerElement = element;
          setContainerElement(element ?? null);

          if (!modalContainerElement || isPanel()) {
            return;
          }

          const handleCapture = (event: MouseEvent) => {
            const target = event.target as Node | null;
            if (target && closeButtonElement?.contains(target)) {
              return;
            }

            ignoreCloseInvocation = true;
            scheduleIgnoreReset();
          };

          const stopPropagation = (event: MouseEvent) => {
            event.stopPropagation();
          };

          modalContainerElement.addEventListener('click', handleCapture, true);
          modalContainerElement.addEventListener('click', stopPropagation);

          removeContainerListeners = () => {
            modalContainerElement?.removeEventListener('click', handleCapture, true);
            modalContainerElement?.removeEventListener('click', stopPropagation);
          };

          onCleanup(() => {
            removeContainerListeners?.();
            removeContainerListeners = null;
          });
        }}
        class='settings-modal-content'
        data-position={position()}
        role='document'
      >
        {content}
      </div>
    </div>
  );
}

export default SettingsModal;
