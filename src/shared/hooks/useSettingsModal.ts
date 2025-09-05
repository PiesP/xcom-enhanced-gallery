/**
 * @fileoverview useSettingsModal Hook
 * @description 설정 모달의 상태와 핸들러를 관리하는 headless hook
 */

import { getPreactHooks } from '@shared/external/vendors';
import { LanguageService } from '@shared/services/LanguageService';
import { ThemeService } from '@shared/services/ThemeService';

export interface UseSettingsModalOptions {
  languageService?: LanguageService;
  themeService?: ThemeService;
}

export interface UseSettingsModalReturn {
  // 상태
  currentTheme: 'auto' | 'light' | 'dark';
  currentLanguage: 'auto' | 'ko' | 'en' | 'ja';

  // 핸들러
  handleThemeChange: (theme: 'auto' | 'light' | 'dark') => void;
  handleLanguageChange: (language: 'auto' | 'ko' | 'en' | 'ja') => void;

  // 서비스
  languageService: LanguageService;
  themeService: ThemeService;
}

/**
 * 설정 모달 상태 관리 Hook
 */
export function useSettingsModal(options: UseSettingsModalOptions = {}): UseSettingsModalReturn {
  const { useState, useCallback } = getPreactHooks();

  // 서비스 초기화
  const [languageService] = useState(() => options.languageService || new LanguageService());
  const [themeService] = useState(() => options.themeService || new ThemeService());

  // 상태
  const [currentTheme, setCurrentTheme] = useState<'auto' | 'light' | 'dark'>(() =>
    themeService.getCurrentTheme
      ? (themeService.getCurrentTheme() as 'auto' | 'light' | 'dark')
      : 'auto'
  );

  const [currentLanguage, setCurrentLanguage] = useState<'auto' | 'ko' | 'en' | 'ja'>(() =>
    languageService.getCurrentLanguage()
  );

  // 테마 변경 핸들러
  const handleThemeChange = useCallback(
    (newTheme: 'auto' | 'light' | 'dark') => {
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

  // 언어 변경 핸들러
  const handleLanguageChange = useCallback(
    (newLanguage: 'auto' | 'ko' | 'en' | 'ja') => {
      setCurrentLanguage(newLanguage);
      languageService.setLanguage(newLanguage);
    },
    [languageService]
  );

  return {
    currentTheme,
    currentLanguage,
    handleThemeChange,
    handleLanguageChange,
    languageService,
    themeService,
  };
}
