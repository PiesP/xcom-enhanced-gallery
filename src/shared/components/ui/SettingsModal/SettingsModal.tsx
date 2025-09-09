/**
 * @fileoverview SettingsModal - Unified Settings Modal Component
 * @description Single source of truth for all settings modal functionality
 */
import {
  getPreact,
  getPreactHooks,
  type VNode,
  type ComponentChildren,
} from '@shared/external/vendors';
import { useFocusTrap } from '@shared/hooks/useFocusTrap';
import { useScrollLock } from '@shared/hooks/useScrollLock';
import { ComponentStandards } from '../StandardProps';
import { X } from '../Icon';
import { LanguageService } from '@shared/services/LanguageService';
import { ThemeService } from '@shared/services/ThemeService';
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

/**
 * SettingsModal - Unified settings modal component
 *
 * Supports both panel and modal modes with accessibility features
 */
export function SettingsModal({
  isOpen,
  onClose,
  mode = 'panel',
  position = 'center',
  children,
  className = '',
  'data-testid': testId,
}: SettingsModalProps): VNode | null {
  const { h } = getPreact();
  const { useState, useEffect, useRef, useCallback } = getPreactHooks();

  const [currentTheme, setCurrentTheme] = useState<'auto' | 'light' | 'dark'>('auto');
  const [currentLanguage, setCurrentLanguage] = useState<'auto' | 'ko' | 'en' | 'ja'>('auto');
  const [languageService] = useState(() => new LanguageService());
  const [themeService] = useState(() => new ThemeService());

  const panelRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const modalContainerRef = useRef<HTMLDivElement | null>(null);

  // Panel mode logic
  useEffect(() => {
    if (!isOpen || mode !== 'panel') return;

    setCurrentLanguage(languageService.getCurrentLanguage());
    setCurrentTheme(
      themeService.getCurrentTheme
        ? (themeService.getCurrentTheme() as typeof currentTheme)
        : 'auto'
    );

    // Basic keyboard event handling
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    // Basic scroll lock for panel mode
    if (typeof document !== 'undefined') {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        document.removeEventListener('keydown', handleKeyDown);
      };
    }

    return () => {
      // Panel cleanup logic
    };
  }, [isOpen, mode, languageService, themeService, onClose]);

  // Modal mode logic
  if (mode === 'modal') {
    useFocusTrap(modalContainerRef.current, isOpen, { onEscape: onClose, restoreFocus: true });
    useScrollLock({ enabled: isOpen, reserveScrollBarGap: true });
  }

  const handleThemeChange = useCallback(
    (event: Event) => {
      const newTheme = (event.target as HTMLSelectElement).value as 'auto' | 'light' | 'dark';
      setCurrentTheme(newTheme);
      themeService.setTheme(newTheme);
      if (typeof document !== 'undefined') {
        if (newTheme === 'auto') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
          document.documentElement.setAttribute('data-theme', newTheme);
        }
      }
    },
    [themeService]
  );

  const handleLanguageChange = useCallback(
    (event: Event) => {
      const newLanguage = (event.target as HTMLSelectElement).value as 'auto' | 'ko' | 'en' | 'ja';
      setCurrentLanguage(newLanguage);
      languageService.setLanguage(newLanguage);
    },
    [languageService]
  );

  if (!isOpen) return null;

  const testProps = ComponentStandards.createTestProps(testId);
  const normalizedPosition = ((): 'toolbar-below' | 'top-right' => {
    if (position === 'top-right') return 'top-right';
    return 'toolbar-below';
  })();
  const positionClass = normalizedPosition === 'top-right' ? styles.topRight : styles.toolbarBelow;

  const panelClass = ComponentStandards.createClassName(styles.panel, positionClass, className);
  const innerClass = ComponentStandards.createClassName(styles.modal, styles.inner);

  const header = h('div', { className: styles.header, key: 'header' }, [
    h(
      'h2',
      { id: 'settings-title', className: styles.title, key: 'title' },
      languageService.getString('settings.title')
    ),
    h(
      'button',
      {
        type: 'button',
        className: `${toolbarStyles.toolbarButton} ${styles.closeButton}`,
        onClick: onClose,
        'aria-label': 'Close',
        key: 'close',
      },
      h(X, { size: 16 })
    ),
  ]);

  const themeSelect = h(
    'select',
    {
      id: 'theme-select',
      className: `${toolbarStyles.toolbarButton} ${styles.select}`,
      value: currentTheme,
      onChange: handleThemeChange,
    },
    [
      h('option', { value: 'auto' }, languageService.getString('settings.themeAuto')),
      h('option', { value: 'light' }, languageService.getString('settings.themeLight')),
      h('option', { value: 'dark' }, languageService.getString('settings.themeDark')),
    ]
  );

  const languageSelect = h(
    'select',
    {
      id: 'language-select',
      className: `${toolbarStyles.toolbarButton} ${styles.select}`,
      value: currentLanguage,
      onChange: handleLanguageChange,
    },
    [
      h('option', { value: 'auto' }, '자동 / Auto / 自動'),
      h('option', { value: 'ko' }, '한국어'),
      h('option', { value: 'en' }, 'English'),
      h('option', { value: 'ja' }, '日本語'),
    ]
  );

  const defaultBody = h('div', { className: styles.body, key: 'body' }, [
    h('div', { className: styles.setting, key: 'theme-setting' }, [
      h(
        'label',
        { htmlFor: 'theme-select', className: styles.label },
        languageService.getString('settings.theme')
      ),
      themeSelect,
    ]),
    h('div', { className: styles.setting, key: 'language-setting' }, [
      h(
        'label',
        { htmlFor: 'language-select', className: styles.label },
        languageService.getString('settings.language')
      ),
      languageSelect,
    ]),
  ]);

  const contentChildren = children ? [header, children] : [header, defaultBody];
  const content = h(
    'div',
    { ref: innerRef, id: 'settings-content', className: innerClass },
    contentChildren
  );

  if (mode === 'panel') {
    return h(
      'div',
      {
        ref: panelRef,
        className: panelClass,
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': 'settings-title',
        'aria-describedby': 'settings-content',
        'data-position': position,
        onClick: (e: MouseEvent) => {
          if (panelRef.current && e.target === panelRef.current) onClose();
        },
        ...testProps,
      },
      content
    ) as unknown as VNode;
  }

  // Modal mode
  const backdropProps = {
    class: 'settings-modal-backdrop',
    onClick: (event: Event) => {
      if (event.target === event.currentTarget) onClose();
    },
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'settings-title',
    'aria-describedby': 'settings-content',
    ...testProps,
  } as const;

  return h(
    'div',
    backdropProps as Record<string, unknown>,
    h(
      'div',
      {
        ref: modalContainerRef,
        class: 'settings-modal-content',
        role: 'document',
      },
      content
    )
  );
}

export default SettingsModal;
