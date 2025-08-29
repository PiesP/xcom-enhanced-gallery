/**
 * @fileoverview 설정 패널 (재작성)
 * @description 비정상적이던 기존 모달 레이아웃/백드롭을 제거하고, 툴바 디자인 요소(toolbarButton, glass-surface)를 그대로 재사용하는 경량 패널.
 * - 새로운 시각 요소 도입 금지: Toolbar CSS 클래스 재사용
 * - 단순 포지셔닝: 기본(top 고정 후 Toolbar 아래) / top-right 지원
 */

import { getPreact, getPreactHooks, type VNode } from '../../../external/vendors';
import { ComponentStandards } from '../StandardProps';
import { X } from '../Icon';
import { LanguageService } from '../../../services/LanguageService';
import { ThemeService } from '../../../services/ThemeService';
// Toolbar 스타일 재사용 (버튼 등)
import toolbarStyles from '../Toolbar/Toolbar.module.css';
import styles from './SettingsModal.module.css';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** (호환) 패널 위치 - 구 레거시 명칭 center/bottom-sheet 지원 */
  position?: 'toolbar-below' | 'top-right' | 'center' | 'bottom-sheet';
  className?: string;
  'data-testid'?: string;
}

export function SettingsModal({
  isOpen,
  onClose,
  // 레거시 테스트 호환: 기본 position 은 'center' 로 간주 (실제 레이아웃은 toolbar-below 와 동일 처리)
  position = 'center',
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
  const previouslyFocusedRef = useRef<Element | null>(null);
  const originalBodyOverflowRef = useRef<string>('');
  const backgroundElementsRef = useRef<HTMLElement[]>([]);

  // 열릴 때 현재 상태 동기화 (언어/테마) 및 포커스 저장
  useEffect(() => {
    if (!isOpen) return;
    previouslyFocusedRef.current = typeof document !== 'undefined' ? document.activeElement : null;
    setCurrentLanguage(languageService.getCurrentLanguage());
    setCurrentTheme(
      themeService.getCurrentTheme
        ? (themeService.getCurrentTheme() as typeof currentTheme)
        : 'auto'
    );
    // Scroll lock
    if (typeof document !== 'undefined') {
      originalBodyOverflowRef.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      // Background inert/tabindex 관리 (간단: body 직속 자식)
      backgroundElementsRef.current = [];
      const children = Array.from(document.body.children) as HTMLElement[];
      children.forEach(el => {
        if (!panelRef.current || panelRef.current === el || panelRef.current.contains(el)) return;
        if (!el.hasAttribute('data-xeg-prev-tabindex')) {
          const prev = el.getAttribute('tabindex');
          if (prev !== null) {
            el.setAttribute('data-xeg-prev-tabindex', prev);
          }
          el.setAttribute('tabindex', '-1');
          backgroundElementsRef.current.push(el);
        }
      });
    }
    return () => {
      // cleanup when dialog unmounts while open
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
  }, [isOpen, languageService, themeService, currentTheme]);

  // Esc / 바깥 클릭 닫기 (간단 처리, 백드롭 없음)
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        // ESC는 이벤트 target 이 패널 내부일 때만 처리 (포커스만 내부인 경우는 무시)
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
      // 패널 외부 클릭 또는 패널 자체 클릭 (배경 역할) 시 닫기
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
  }, [isOpen, onClose]);

  // 초기 포커스 이동 (닫기 버튼 - 테스트 기대)
  useEffect(() => {
    if (!isOpen) return;
    const closeBtn = panelRef.current?.querySelector(
      'button[aria-label="Close"]'
    ) as HTMLButtonElement | null;
    if (closeBtn) closeBtn.focus();
  }, [isOpen]);

  // 닫힐 때 포커스 복귀
  useEffect(() => {
    if (isOpen) return;
    const prev = previouslyFocusedRef.current as HTMLElement | null;
    if (prev && typeof prev.focus === 'function') {
      prev.focus();
    }
  }, [isOpen]);

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
  // 위치 매핑 (레거시 center -> toolbar-below, bottom-sheet -> toolbar-below 변형)
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
    'accessibility-enhanced', // 접근성 개선을 위한 CSS 클래스 추가
    ...legacyPositionClasses,
    className
  );
  const innerClass = ComponentStandards.createClassName(
    styles.modal, // alias for legacy tests
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

  const body = h('div', { className: styles.body, key: 'body' }, [
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

  const content = h('div', { ref: innerRef, id: 'settings-content', className: innerClass }, [
    header,
    body,
  ]);
  const node = h(
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
        // 테스트는 role='dialog' 요소 자체 클릭을 배경 클릭으로 간주
        if (panelRef.current && e.target === panelRef.current) {
          onClose();
        }
      },
      ...testProps,
    },
    content
  );
  return node as unknown as VNode;
}
