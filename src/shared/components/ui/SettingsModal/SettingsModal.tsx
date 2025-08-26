/**
 * @fileoverview 설정 모달 컴포넌트
 * @description TDD 기반으로 구현된 설정 모달
 */

import { getPreact, getPreactHooks, type VNode } from '../../../external/vendors';
import { ComponentStandards } from '../StandardProps';
import { X } from '../Icon';
import { LanguageService } from '../../../services/LanguageService';
import { ThemeService } from '../../../services/ThemeService';
import styles from './SettingsModal.module.css';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'center' | 'toolbar-below' | 'bottom-sheet' | 'top-right';
  className?: string;
  'data-testid'?: string;
}

export function SettingsModal({
  isOpen,
  onClose,
  position = 'center',
  className = '',
  'data-testid': testId,
}: SettingsModalProps): VNode | null {
  const { h } = getPreact();
  const { useState, useEffect, useCallback, useRef } = getPreactHooks();

  const [currentTheme, setCurrentTheme] = useState<'auto' | 'light' | 'dark'>('auto');
  const [currentLanguage, setCurrentLanguage] = useState<'auto' | 'ko' | 'en' | 'ja'>('auto');
  const [languageService] = useState(() => new LanguageService());
  const [_themeService] = useState(() => new ThemeService());
  const [_forceUpdate, setForceUpdate] = useState(0);

  // 접근성 개선을 위한 refs
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const backgroundElementsRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    // 현재 설정 로드
    setCurrentTheme('auto'); // ThemeService에서 가져올 예정
    setCurrentLanguage(languageService.getCurrentLanguage());
  }, [isOpen, languageService]);

  // 언어 변경에 반응하여 컴포넌트 재렌더링
  useEffect(() => {
    const unsubscribe = languageService.onLanguageChange(() => {
      setForceUpdate(prev => prev + 1);
    });

    return unsubscribe;
  }, [languageService]);

  // 접근성 개선: 스크롤 잠금, 포커스 관리, 배경 요소 비활성화
  useEffect(() => {
    if (!isOpen) return;

    // 이전 포커스 요소 저장
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    // 스크롤 잠금
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // 배경 요소 비활성화
    const focusableElements = Array.from(
      document.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );

    backgroundElementsRef.current = focusableElements.filter(
      el => !dialogRef.current?.contains(el)
    );

    backgroundElementsRef.current.forEach(el => {
      el.setAttribute('tabindex', '-1');
    });

    // 초기 포커스 설정
    const timer = setTimeout(() => {
      if (dialogRef.current) {
        const firstFocusable = dialogRef.current.querySelector<HTMLElement>(
          'button:not([disabled]), [href], select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      // 스크롤 잠금 해제
      document.body.style.overflow = originalOverflow;

      // 배경 요소 활성화
      backgroundElementsRef.current.forEach(el => {
        el.removeAttribute('tabindex');
      });

      // 포커스 복원
      if (previouslyFocusedRef.current) {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [isOpen]);

  const handleThemeChange = useCallback(
    (event: Event) => {
      const target = event.target as HTMLSelectElement;
      const newTheme = target.value as 'auto' | 'light' | 'dark';

      setCurrentTheme(newTheme);

      // ThemeService와 연동하여 실제 테마 적용
      if (_themeService) {
        _themeService.setTheme(newTheme);

        // documentElement에 data-theme 속성 설정
        if (typeof document !== 'undefined') {
          if (newTheme === 'auto') {
            // 시스템 테마 확인
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
          } else {
            document.documentElement.setAttribute('data-theme', newTheme);
          }
        }
      }
    },
    [_themeService]
  );

  const handleLanguageChange = useCallback(
    (event: Event) => {
      const target = event.target as HTMLSelectElement;
      const newLanguage = target.value as 'auto' | 'ko' | 'en' | 'ja';

      setCurrentLanguage(newLanguage);
      languageService.setLanguage(newLanguage);
    },
    [languageService]
  );

  const handleBackdropClick = useCallback(
    (event: Event) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      // 포커스 트랩 구현
      if (event.key === 'Tab' && dialogRef.current) {
        const focusableElements = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], select:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement as HTMLElement;

        if (event.shiftKey) {
          // Shift+Tab: 첫 번째 요소에서 마지막 요소로
          if (activeElement === firstElement && lastElement) {
            lastElement.focus();
            event.preventDefault();
          }
        } else {
          // Tab: 마지막 요소에서 첫 번째 요소로
          if (activeElement === lastElement && firstElement) {
            firstElement.focus();
            event.preventDefault();
          }
        }
      }
    },
    [onClose]
  );

  // 키보드 이벤트 처리 (전역으로 수정)
  useEffect(() => {
    if (!isOpen) return;

    const keyDownHandler = (event: KeyboardEvent) => {
      // ESC 키는 항상 처리
      if (event.key === 'Escape') {
        handleKeyDown(event);
        return;
      }

      // Tab 키는 모달 내부에 포커스가 있을 때만 처리
      if (event.key === 'Tab' && dialogRef.current) {
        const activeElement = document.activeElement as HTMLElement;
        if (dialogRef.current.contains(activeElement)) {
          handleKeyDown(event);
        }
      }
    };

    document.addEventListener('keydown', keyDownHandler);

    return () => {
      document.removeEventListener('keydown', keyDownHandler);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  // Position에 따른 CSS 클래스 선택
  const positionClass =
    position === 'center'
      ? styles.center
      : position === 'toolbar-below'
        ? styles.toolbarBelow
        : position === 'bottom-sheet'
          ? styles.bottomSheet
          : position === 'top-right'
            ? styles.topRight
            : styles.center;

  const modalClass = ComponentStandards.createClassName(styles.backdrop, positionClass, className);

  const testProps = ComponentStandards.createTestProps(testId);

  return h(
    'div',
    {
      className: modalClass,
      onClick: handleBackdropClick,
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'settings-title',
      'aria-describedby': 'settings-content',
      ...testProps,
    },
    [
      h(
        'div',
        {
          ref: dialogRef,
          className: `${styles.modal} glass-surface-dark`, // 툴바와 동일한 어두운 glassmorphism 클래스 사용
          onClick: (e: Event) => e.stopPropagation(),
        },
        [
          h(
            'div',
            {
              className: styles.header,
              key: 'header',
            },
            [
              h(
                'h2',
                {
                  id: 'settings-title',
                  className: styles.title,
                  key: 'title',
                },
                languageService.getString('settings.title')
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: `${styles.closeButton} glass-surface-light`,
                  onClick: onClose,
                  'aria-label': languageService.getString('settings.close'),
                  key: 'close',
                },
                h(X, { size: 20 })
              ),
            ]
          ),
          h(
            'div',
            {
              id: 'settings-content',
              className: styles.content,
              key: 'content',
            },
            [
              h(
                'div',
                {
                  className: styles.setting,
                  key: 'theme-setting',
                },
                [
                  h(
                    'label',
                    {
                      htmlFor: 'theme-select',
                      className: `${styles.label} glass-surface-light`,
                    },
                    languageService.getString('settings.theme')
                  ),
                  h(
                    'select',
                    {
                      id: 'theme-select',
                      className: `${styles.select} glass-surface-light`,
                      value: currentTheme,
                      onChange: handleThemeChange,
                      'aria-label': languageService.getString('settings.theme'),
                    },
                    [
                      h(
                        'option',
                        { value: 'auto' },
                        languageService.getString('settings.themeAuto')
                      ),
                      h(
                        'option',
                        { value: 'light' },
                        languageService.getString('settings.themeLight')
                      ),
                      h(
                        'option',
                        { value: 'dark' },
                        languageService.getString('settings.themeDark')
                      ),
                    ]
                  ),
                ]
              ),
              h(
                'div',
                {
                  className: styles.setting,
                  key: 'language-setting',
                },
                [
                  h(
                    'label',
                    {
                      htmlFor: 'language-select',
                      className: `${styles.label} glass-surface-light`,
                    },
                    languageService.getString('settings.language')
                  ),
                  h(
                    'select',
                    {
                      id: 'language-select',
                      className: `${styles.select} glass-surface-light`,
                      value: currentLanguage,
                      onChange: handleLanguageChange,
                      'aria-label': languageService.getString('settings.language'),
                    },
                    [
                      h('option', { value: 'auto' }, '자동 / Auto / 自動'),
                      h('option', { value: 'ko' }, '한국어'),
                      h('option', { value: 'en' }, 'English'),
                      h('option', { value: 'ja' }, '日本語'),
                    ]
                  ),
                ]
              ),
            ]
          ),
        ]
      ),
    ]
  );
}
