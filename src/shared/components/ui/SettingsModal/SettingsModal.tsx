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
  const { useState, useEffect, useCallback } = getPreactHooks();

  const [currentTheme, setCurrentTheme] = useState<'auto' | 'light' | 'dark'>('auto');
  const [currentLanguage, setCurrentLanguage] = useState<'auto' | 'ko' | 'en' | 'ja'>('auto');
  const [languageService] = useState(() => new LanguageService());
  const [_themeService] = useState(() => new ThemeService());
  const [_forceUpdate, setForceUpdate] = useState(0);

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

  const handleThemeChange = useCallback((event: Event) => {
    const target = event.target as HTMLSelectElement;
    const newTheme = target.value as 'auto' | 'light' | 'dark';

    setCurrentTheme(newTheme);
    // themeService.setTheme(newTheme); // ThemeService 확장 후 활성화
  }, []);

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
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
    return undefined;
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
      ...testProps,
    },
    [
      h(
        'div',
        {
          className: styles.modal,
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
                  className: styles.closeButton,
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
                      className: styles.label,
                    },
                    languageService.getString('settings.theme')
                  ),
                  h(
                    'select',
                    {
                      id: 'theme-select',
                      className: styles.select,
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
                      className: styles.label,
                    },
                    languageService.getString('settings.language')
                  ),
                  h(
                    'select',
                    {
                      id: 'language-select',
                      className: styles.select,
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
