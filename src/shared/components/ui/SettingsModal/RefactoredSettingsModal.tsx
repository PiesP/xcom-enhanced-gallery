/**
 * @fileoverview RefactoredSettingsModal (Unified Settings Modal)
 * @description SettingsModal(패널) + EnhancedSettingsModal(백드롭) 통합. 단일 컴포넌트에서 모드 스위칭.
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

export interface RefactoredSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'panel' | 'modal';
  position?: 'toolbar-below' | 'top-right' | 'center' | 'bottom-sheet';
  children?: ComponentChildren;
  className?: string;
  'data-testid'?: string;
}

let warnedSettingsModal = false;
export function devWarnOnce(message: string): void {
  if (typeof process === 'undefined') return;
  if (process.env.NODE_ENV !== 'development') return;
  if (warnedSettingsModal) return;
  console.warn(`[SettingsModal Deprecation] ${message}`);
  warnedSettingsModal = true;
}

export function RefactoredSettingsModal({
  isOpen,
  onClose,
  mode = 'panel',
  position = 'center',
  children,
  className = '',
  'data-testid': testId,
}: RefactoredSettingsModalProps): VNode | null {
  const { h } = getPreact();
  const { useState, useEffect, useRef, useCallback } = getPreactHooks();

  const [currentTheme, setCurrentTheme] = useState<'auto' | 'light' | 'dark'>('auto');
  const [currentLanguage, setCurrentLanguage] = useState<'auto' | 'ko' | 'en' | 'ja'>('auto');
  const [languageService] = useState(() => new LanguageService());
  const [themeService] = useState(() => new ThemeService());

  const panelRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<Element | null>(null);
  const originalBodyOverflowRef = useRef<string>('');
  const backgroundElementsRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    if (!isOpen || mode !== 'panel') return;
    previouslyFocusedRef.current = typeof document !== 'undefined' ? document.activeElement : null;
    setCurrentLanguage(languageService.getCurrentLanguage());
    setCurrentTheme(
      themeService.getCurrentTheme
        ? (themeService.getCurrentTheme() as typeof currentTheme)
        : 'auto'
    );
    if (typeof document !== 'undefined') {
      originalBodyOverflowRef.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      backgroundElementsRef.current = [];
      const childrenEls = Array.from(document.body.children) as HTMLElement[];
      childrenEls.forEach(el => {
        if (!panelRef.current || panelRef.current === el || panelRef.current.contains(el)) return;
        if (!el.hasAttribute('data-xeg-prev-tabindex')) {
          const prev = el.getAttribute('tabindex');
          if (prev !== null) el.setAttribute('data-xeg-prev-tabindex', prev);
          el.setAttribute('tabindex', '-1');
          backgroundElementsRef.current.push(el);
        }
      });
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = originalBodyOverflowRef.current;
        backgroundElementsRef.current.forEach(el => {
          const prev = el.getAttribute('data-xeg-prev-tabindex');
          if (prev !== null) {
            el.setAttribute('tabindex', prev);
            el.removeAttribute('data-xeg-prev-tabindex');
          } else {
            el.removeAttribute('tabindex');
          }
        });
      }
    };
  }, [isOpen, mode, languageService, themeService, currentTheme]);

  useEffect(() => {
    if (!isOpen || mode !== 'panel') return;
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        const target = e.target as Node | null;
        if (panelRef.current && target && panelRef.current.contains(target)) {
          e.stopPropagation();
          onClose();
          return;
        }
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]),select:not([disabled]),[href],[tabindex]:not([tabindex="-1"])'
        );
        const list = Array.from(focusables).filter(el => !el.hasAttribute('disabled'));
        if (list.length === 0) return;
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first && last) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last && first) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    const handleClick = (e: MouseEvent): void => {
      if (!panelRef.current) return;
      const target = e.target as Node;
      if (!panelRef.current.contains(target) || target === panelRef.current) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [isOpen, mode, onClose]);

  useEffect(() => {
    if (mode !== 'panel') return;
    if (!isOpen) {
      const prev = previouslyFocusedRef.current as HTMLElement | null;
      if (prev && typeof prev.focus === 'function') prev.focus();
    } else {
      const closeBtn = panelRef.current?.querySelector(
        'button[aria-label="Close"]'
      ) as HTMLButtonElement | null;
      if (closeBtn) closeBtn.focus();
    }
  }, [isOpen, mode]);

  const modalContainerRef = useRef<HTMLDivElement | null>(null);
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
  const legacyPositionClasses: string[] = [];
  if (position === 'center' && styles.center) legacyPositionClasses.push(styles.center);
  if (position === 'bottom-sheet' && styles.bottomSheet)
    legacyPositionClasses.push(styles.bottomSheet);

  const panelClass = ComponentStandards.createClassName(
    styles.panel,
    positionClass,
    ...legacyPositionClasses,
    className
  );
  const innerClass = ComponentStandards.createClassName(
    styles.modal,
    'glass-surface',
    styles.inner
  );

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

  const backdropProps = {
    class: 'enhanced-settings-modal-backdrop',
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
        class: 'enhanced-settings-modal-content',
        role: 'document',
      },
      content
    )
  );
}

export default RefactoredSettingsModal;
