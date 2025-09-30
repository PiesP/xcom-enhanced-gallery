/**
 * @fileoverview SettingsModal - SolidJS implementation
 * @description FRAME-ALT-001 Stage D Phase 2 shared UI migration
 */

import type { JSX } from 'solid-js';
import { getSolidCore } from '@shared/external/vendors';
import { ComponentStandards } from '../StandardProps';
import { ModalShell } from '../ModalShell';
import { IconButton } from '../Button/IconButton';
import { LanguageService } from '@shared/services/LanguageService';
import { ThemeService } from '@shared/services/ThemeService';
import { getSetting, setSetting } from '@shared/container/settings-access';
import primitiveStyles from '@shared/styles/primitives.module.css';
import styles from './SettingsModal.module.css';

export interface SettingsModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly mode?: 'panel' | 'modal';
  readonly position?: 'toolbar-below' | 'top-right' | 'center' | 'bottom-sheet';
  readonly children?: JSX.Element;
  readonly className?: string;
  readonly 'data-testid'?: string;
}

type ThemeOption = 'auto' | 'light' | 'dark';
type LanguageOption = 'auto' | 'ko' | 'en' | 'ja';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

interface LocalizedStrings {
  readonly title: string;
  readonly theme: string;
  readonly language: string;
  readonly themeAuto: string;
  readonly themeLight: string;
  readonly themeDark: string;
  readonly downloadProgressToast: string;
}

const computeLocalizedStrings = (service: LanguageService): LocalizedStrings => ({
  title: service.getString('settings.title'),
  theme: service.getString('settings.theme'),
  language: service.getString('settings.language'),
  themeAuto: service.getString('settings.themeAuto'),
  themeLight: service.getString('settings.themeLight'),
  themeDark: service.getString('settings.themeDark'),
  downloadProgressToast: service.getString('settings.downloadProgressToast'),
});

export const SettingsModal = (providedProps: SettingsModalProps): JSX.Element | null => {
  const solid = getSolidCore();
  const props = solid.mergeProps(
    {
      mode: 'panel' as const,
      position: 'center' as const,
      className: '',
    },
    providedProps
  );

  const [local, rest] = solid.splitProps(props, [
    'isOpen',
    'onClose',
    'mode',
    'position',
    'children',
    'className',
    'data-testid',
  ]);

  const [currentTheme, setCurrentTheme] = solid.createSignal<ThemeOption>('auto');
  const [currentLanguage, setCurrentLanguage] = solid.createSignal<LanguageOption>('auto');
  const [showProgressToast, setShowProgressToast] = solid.createSignal(false);

  const languageService = new LanguageService();
  const themeService = new ThemeService();

  const [localizedStrings, setLocalizedStrings] = solid.createSignal(
    computeLocalizedStrings(languageService)
  );

  let panelRef: HTMLDivElement | undefined;
  let closeButtonRef: HTMLButtonElement | undefined;
  let previousFocus: HTMLElement | null = null;
  let scrollLocked = false;
  let originalBodyOverflow: string | null = null;
  let inertElements: Array<{ element: HTMLElement; originalTabIndex: string | null }> = [];

  const focusSafely = (element: HTMLElement | null | undefined) => {
    if (!element) return;
    try {
      if (element.tabIndex < 0 && !element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '-1');
      }
      element.focus();
    } catch {
      /* no-op */
    }
  };

  const capturePreviousFocus = () => {
    if (typeof document === 'undefined') return;
    const active = document.activeElement;
    previousFocus = active instanceof HTMLElement ? active : null;
  };

  const restorePreviousFocus = () => {
    if (!previousFocus) return;
    if (previousFocus.isConnected) {
      focusSafely(previousFocus);
    }
    previousFocus = null;
  };

  const setBackgroundInert = (inert: boolean) => {
    if (typeof document === 'undefined') return;
    if (!panelRef) return;

    if (inert) {
      // 모달 외부의 모든 직계 자식들을 찾아서 비활성화
      const rootChildren = Array.from(document.body.children) as HTMLElement[];
      rootChildren.forEach(child => {
        // 현재 모달은 제외
        if (child === panelRef || panelRef?.contains(child)) return;

        const originalTabIndex = child.getAttribute('tabindex');
        child.setAttribute('tabindex', '-1');
        inertElements.push({ element: child, originalTabIndex });
      });
    } else {
      // 원래 tabindex 복원
      inertElements.forEach(({ element, originalTabIndex }) => {
        if (originalTabIndex === null) {
          element.removeAttribute('tabindex');
        } else {
          element.setAttribute('tabindex', originalTabIndex);
        }
      });
      inertElements = [];
    }
  };

  const lockBodyScroll = (locked: boolean) => {
    if (typeof document === 'undefined') return;
    if (locked) {
      if (scrollLocked) return;
      // 현재 overflow 값을 캡처 (빈 문자열이면 명시적으로 null로 저장)
      const currentOverflow = document.body.style.overflow;
      originalBodyOverflow = currentOverflow || null;
      document.body.style.overflow = 'hidden';
      scrollLocked = true;
    } else if (scrollLocked) {
      // 복원 시 원래 값이 없으면 'overflow' 속성 자체를 제거
      if (originalBodyOverflow === null || originalBodyOverflow === '') {
        document.body.style.removeProperty('overflow');
      } else {
        document.body.style.overflow = originalBodyOverflow;
      }
      originalBodyOverflow = null;
      scrollLocked = false;
    }
  };

  const runNextTick = (callback: () => void) => {
    try {
      const queue = (globalThis as { queueMicrotask?: (cb: () => void) => void }).queueMicrotask;
      if (typeof queue === 'function') {
        queue(callback);
        return;
      }
    } catch {
      /* ignore */
    }
    if (typeof window !== 'undefined') {
      window.setTimeout(callback, 0);
    }
  };

  const getFocusableElements = (): HTMLElement[] => {
    if (!panelRef) return [];
    const nodes = panelRef.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
    return Array.from(nodes).filter(element => {
      if (element.hasAttribute('disabled')) return false;
      const ariaDisabled = element.getAttribute('aria-disabled');
      return ariaDisabled !== 'true';
    });
  };

  const refreshLocalization = () => {
    setLocalizedStrings(computeLocalizedStrings(languageService));
  };

  const setPanelRef = (element: HTMLDivElement | null) => {
    panelRef = element ?? undefined;
  };

  const setCloseButtonRef = (element: HTMLButtonElement | null) => {
    closeButtonRef = element ?? undefined;
  };

  type SelectChangeEvent = Event & {
    readonly currentTarget: HTMLSelectElement;
    readonly target: Element;
  };
  type InputChangeEvent = Event & {
    readonly currentTarget: HTMLInputElement;
    readonly target: Element;
  };
  type PanelMouseEvent = MouseEvent & {
    readonly currentTarget: HTMLDivElement;
    readonly target: Element;
  };
  type PanelKeyboardEvent = KeyboardEvent & {
    readonly currentTarget: HTMLDivElement;
    readonly target: Element;
  };

  const handleThemeChange = (event: SelectChangeEvent) => {
    const element = event.currentTarget;
    const newTheme = element.value as ThemeOption;
    setCurrentTheme(newTheme);
    try {
      themeService.setTheme(newTheme);
    } catch {
      /* ignore theme errors */
    }
  };

  const handleLanguageChange = (event: SelectChangeEvent) => {
    const element = event.currentTarget;
    const newLanguage = element.value as LanguageOption;
    setCurrentLanguage(newLanguage);
    languageService.setLanguage(newLanguage);
    refreshLocalization();
  };

  const handleProgressToastToggle = (event: InputChangeEvent) => {
    const element = event.currentTarget;
    const checked = element.checked;
    setShowProgressToast(checked);
    setSetting('download.showProgressToast', checked).catch(() => undefined);
  };

  const handleCloseClick = () => {
    local.onClose?.();
  };

  const handlePanelClick = (event: PanelMouseEvent) => {
    if (event.target === event.currentTarget) {
      event.preventDefault();
      local.onClose?.();
    }
  };

  const handleKeyDown = (event: PanelKeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      local.onClose?.();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusable = getFocusableElements();
    if (focusable.length === 0) {
      event.preventDefault();
      focusSafely(panelRef ?? null);
      return;
    }

    const active =
      typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;
    let index = active ? focusable.indexOf(active) : -1;

    if (event.shiftKey) {
      index = index <= 0 ? focusable.length - 1 : index - 1;
    } else {
      index = index === focusable.length - 1 ? 0 : index + 1;
    }

    event.preventDefault();
    focusSafely(focusable[index]);
  };

  solid.createEffect(() => {
    if (!local.isOpen) {
      lockBodyScroll(false);
      setBackgroundInert(false);
      restorePreviousFocus();
      return;
    }

    capturePreviousFocus();

    try {
      themeService.initialize();
    } catch {
      /* ignore init errors */
    }

    try {
      const themeSetting = themeService.getCurrentTheme();
      setCurrentTheme((themeSetting ?? 'auto') as ThemeOption);
    } catch {
      setCurrentTheme('auto');
    }

    setCurrentLanguage(languageService.getCurrentLanguage());
    refreshLocalization();

    try {
      const persisted = getSetting<boolean>('download.showProgressToast', false);
      setShowProgressToast(Boolean(persisted));
    } catch {
      setShowProgressToast(false);
    }

    if (local.mode === 'panel') {
      lockBodyScroll(true);
      runNextTick(() => {
        setBackgroundInert(true);
        focusSafely(closeButtonRef);
      });
    }
  });

  const unsubscribeLanguage = languageService.onLanguageChange(() => {
    refreshLocalization();
  });

  solid.onCleanup(() => {
    lockBodyScroll(false);
    setBackgroundInert(false);
    restorePreviousFocus();
    unsubscribeLanguage();
  });

  if (!local.isOpen) {
    return null;
  }

  const positionClass = solid.createMemo(() => {
    switch (local.position) {
      case 'center':
        return styles.center ?? '';
      case 'bottom-sheet':
        return styles.bottomSheet ?? '';
      case 'top-right':
        return styles.topRight ?? '';
      case 'toolbar-below':
      default:
        return styles.toolbarBelow ?? '';
    }
  });

  const panelClass = solid.createMemo(() =>
    ComponentStandards.createClassName(styles.panel, positionClass(), local.className ?? '')
  );
  const innerClass = solid.createMemo(() =>
    ComponentStandards.createClassName(styles.modal, styles.inner, local.className ?? '')
  );

  const testProps = ComponentStandards.createTestProps(local['data-testid']);

  const header = () => (
    <div class={styles.header} data-settings-section='header'>
      <h2 id='settings-title' class={styles.title}>
        {localizedStrings().title}
      </h2>
      <IconButton
        ref={setCloseButtonRef}
        className={styles.closeButton ?? ''}
        onClick={handleCloseClick}
        aria-label='Close'
        autoFocus
        size='md'
        intent='secondary'
        iconName='Close'
      />
    </div>
  );

  const themeSelectClass = [primitiveStyles.controlSurface, styles.formControl, styles.select]
    .filter(Boolean)
    .join(' ');

  const languageSelectClass = [primitiveStyles.controlSurface, styles.formControl, styles.select]
    .filter(Boolean)
    .join(' ');

  const defaultBody = () => (
    <div class={styles.body} data-settings-section='body'>
      <div class={styles.setting} data-settings-field='theme'>
        <label for='theme-select' class={styles.label}>
          {localizedStrings().theme}
        </label>
        <select
          id='theme-select'
          class={themeSelectClass}
          value={currentTheme()}
          onChange={handleThemeChange}
          onInput={handleThemeChange}
        >
          <option value='auto'>{localizedStrings().themeAuto}</option>
          <option value='light'>{localizedStrings().themeLight}</option>
          <option value='dark'>{localizedStrings().themeDark}</option>
        </select>
      </div>
      <div class={styles.setting} data-settings-field='language'>
        <label for='language-select' class={styles.label}>
          {localizedStrings().language}
        </label>
        <select
          id='language-select'
          class={languageSelectClass}
          value={currentLanguage()}
          onChange={handleLanguageChange}
          onInput={handleLanguageChange}
        >
          <option value='auto'>자동 / Auto / 自動</option>
          <option value='ko'>한국어</option>
          <option value='en'>English</option>
          <option value='ja'>日本語</option>
        </select>
      </div>
      <div class={styles.setting} data-settings-field='download-progress-toast'>
        <label for='download-progress-toast' class={styles.label}>
          {localizedStrings().downloadProgressToast}
        </label>
        <input
          id='download-progress-toast'
          type='checkbox'
          class={styles.formControlToggle}
          checked={showProgressToast()}
          onChange={handleProgressToastToggle}
          onInput={handleProgressToastToggle}
        />
      </div>
    </div>
  );

  const content = () => (
    <div id='settings-content' class={innerClass()} data-settings-section='content'>
      {header()}
      {local.children ?? defaultBody()}
    </div>
  );

  if (local.mode === 'modal') {
    return (
      <ModalShell
        isOpen={local.isOpen}
        onClose={local.onClose}
        className={ComponentStandards.createClassName(styles.modal, local.className ?? '')}
        aria-label={localizedStrings().title}
        closeOnBackdropClick
        closeOnEscape
        {...(local['data-testid'] ? { 'data-testid': local['data-testid'] } : {})}
        {...rest}
      >
        {content()}
      </ModalShell>
    );
  }

  return (
    <div
      ref={setPanelRef}
      class={panelClass()}
      role='dialog'
      aria-modal='true'
      aria-labelledby='settings-title'
      aria-describedby='settings-content'
      data-position={local.position}
      onClick={handlePanelClick}
      onKeyDown={handleKeyDown}
      {...testProps}
      {...rest}
    >
      {content()}
    </div>
  );
};

export default SettingsModal;
