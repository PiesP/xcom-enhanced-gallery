/**
 * @fileoverview useSettingsModal - Settings modal state management hook
 * @description Phase 39 Step 3-B: Separates settings logic from UI for better testability
 */

import type { Accessor } from 'solid-js';
import { getSolid } from '../external/vendors';
import type { ThemeService } from '../services/theme-service';
import type { LanguageService } from '../services/language-service';

export type ThemeOption = 'auto' | 'light' | 'dark';
export type LanguageOption = 'auto' | 'ko' | 'en' | 'ja';

export interface UseSettingsModalOptions {
  readonly themeService: ThemeService;
  readonly languageService: LanguageService;
  readonly onThemeChange?: (theme: ThemeOption) => void;
  readonly onLanguageChange?: (language: LanguageOption) => void;
}

export interface UseSettingsModalReturn {
  readonly currentTheme: Accessor<ThemeOption>;
  readonly currentLanguage: Accessor<LanguageOption>;
  readonly handleThemeChange: (event: Event) => void;
  readonly handleLanguageChange: (event: Event) => void;
}

/**
 * Settings modal state management hook
 * @description Manages theme and language state with service injection
 * @param options - Hook options with injected services
 * @returns State accessors and event handlers
 * @throws {Error} If required services are not provided
 */
export function useSettingsModal(options: UseSettingsModalOptions): UseSettingsModalReturn {
  const { createSignal } = getSolid();

  // Validate required dependencies
  if (!options.themeService) {
    throw new Error('useSettingsModal: themeService is required');
  }
  if (!options.languageService) {
    throw new Error('useSettingsModal: languageService is required');
  }

  const { themeService, languageService, onThemeChange, onLanguageChange } = options;

  // Initialize state from services
  const [currentTheme, setCurrentTheme] = createSignal<ThemeOption>(
    themeService.getCurrentTheme() as ThemeOption
  );
  const [currentLanguage, setCurrentLanguage] = createSignal<LanguageOption>(
    languageService.getCurrentLanguage() as LanguageOption
  );

  /**
   * Handle theme change event
   * @param event - Change event from select element
   */
  const handleThemeChange = (event: Event): void => {
    const target = event.currentTarget as HTMLSelectElement;
    const nextTheme = target.value as ThemeOption;

    setCurrentTheme(nextTheme);
    themeService.setTheme(nextTheme);

    if (onThemeChange) {
      onThemeChange(nextTheme);
    }
  };

  /**
   * Handle language change event
   * @param event - Change event from select element
   */
  const handleLanguageChange = (event: Event): void => {
    const target = event.currentTarget as HTMLSelectElement;
    const nextLanguage = target.value as LanguageOption;

    setCurrentLanguage(nextLanguage);
    languageService.setLanguage(nextLanguage);

    if (onLanguageChange) {
      onLanguageChange(nextLanguage);
    }
  };

  return {
    currentTheme,
    currentLanguage,
    handleThemeChange,
    handleLanguageChange,
  };
}

export default useSettingsModal;
