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
  const firstFocusableRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusableRef = useRef<HTMLSelectElement | null>(null);

  // 포커스 트랩 구현
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // 모달 내부에서만 이벤트 처리
      if (!isOpen || !panelRef.current?.contains(event.target as Node)) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'Tab') {
        event.preventDefault();

        const firstElement = firstFocusableRef.current;
        const lastElement = lastFocusableRef.current;

        if (!firstElement || !lastElement) return;

        if (event.shiftKey) {
          // Shift+Tab: 첫 번째에서 마지막으로
          if (document.activeElement === firstElement) {
            lastElement.focus();
          } else {
            firstElement.focus();
          }
        } else {
          // Tab: 마지막에서 첫 번째로
          if (document.activeElement === lastElement) {
            firstElement.focus();
          } else {
            lastElement.focus();
          }
        }
      }
    },
    [isOpen, onClose]
  );

  // 배경 요소 비활성화 - 접근성 개선
  const setBackgroundInert = useCallback((inert: boolean) => {
    if (typeof document === 'undefined') return;

    // 설정 모달을 제외한 다른 요소들만 비활성화
    const backgroundElements = document.querySelectorAll('body > *');
    backgroundElements.forEach(element => {
      // dialog나 모달 관련 요소가 포함된 컨테이너는 제외
      const hasDialog = element.querySelector('[role="dialog"], [aria-modal="true"]');
      const isModalContainer =
        element.classList?.contains('settings-modal-backdrop') ||
        (element.hasAttribute?.('data-testid') &&
          element.getAttribute('data-testid')?.includes('settings'));

      if (!hasDialog && !isModalContainer) {
        if (inert) {
          element.setAttribute('tabindex', '-1');
          element.setAttribute('aria-hidden', 'true');
        } else {
          element.removeAttribute('tabindex');
          element.removeAttribute('aria-hidden');
        }
      }
    });
  }, []);

  // Panel mode logic
  useEffect(() => {
    if (!isOpen || mode !== 'panel') return;

    setCurrentLanguage(languageService.getCurrentLanguage());
    setCurrentTheme(
      themeService.getCurrentTheme
        ? (themeService.getCurrentTheme() as typeof currentTheme)
        : 'auto'
    );

    // 접근성 설정
    setBackgroundInert(true);

    // 키보드 이벤트 리스너 등록
    document.addEventListener('keydown', handleKeyDown, true);

    // 첫 번째 포커스 가능한 요소에 포커스
    setTimeout(() => {
      firstFocusableRef.current?.focus();
    }, 0);

    // Basic scroll lock for panel mode
    if (typeof document !== 'undefined') {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalOverflow;
        document.removeEventListener('keydown', handleKeyDown, true);
        setBackgroundInert(false);
      };
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      setBackgroundInert(false);
    };
  }, [isOpen, mode, languageService, themeService, handleKeyDown, setBackgroundInert]);

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

  // 위치 클래스 결정 로직
  const getPositionClass = (): string => {
    switch (position) {
      case 'center':
        return styles.center || '';
      case 'bottom-sheet':
        return styles.bottomSheet || '';
      case 'top-right':
        return styles.topRight || '';
      case 'toolbar-below':
      default:
        return styles.toolbarBelow || '';
    }
  };

  const panelClass = ComponentStandards.createClassName(
    styles.panel,
    getPositionClass(),
    className
  );
  const innerClass = ComponentStandards.createClassName(
    styles.modal,
    styles.inner,
    'glass-surface'
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
        ref: firstFocusableRef,
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
      ref: lastFocusableRef,
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
    onKeyDown: handleKeyDown,
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
