/**
 * @fileoverview Toolbar settings controller hook type definitions
 * @description Types for useToolbarSettingsController hook
 */

import type { LanguageService } from '@shared/services/language-service';
import type { ThemeServiceContract } from '@shared/services/theme-service';

export type ThemeOption = 'auto' | 'light' | 'dark';
export type LanguageOption = 'auto' | 'ko' | 'en' | 'ja';

/**
 * Configuration options for useToolbarSettingsController hook
 */
export interface UseToolbarSettingsControllerOptions {
  readonly isSettingsExpanded: () => boolean;
  readonly setSettingsExpanded: (expanded: boolean) => void;
  readonly toggleSettingsExpanded: () => void;
  readonly documentRef?: Document;
  readonly themeService?: ThemeServiceContract;
  readonly languageService?: LanguageService;
  readonly focusDelayMs?: number;
  readonly selectChangeGuardMs?: number;
}

/**
 * Return type for useToolbarSettingsController hook
 * Contains ref assigners and event handlers for UI interactions
 */
export interface ToolbarSettingsControllerResult {
  readonly assignToolbarRef: (element: HTMLDivElement | null | undefined) => void;
  readonly assignSettingsPanelRef: (element: HTMLDivElement | null | undefined) => void;
  readonly assignSettingsButtonRef: (element: HTMLButtonElement | null | undefined) => void;
  readonly isSettingsExpanded: () => boolean;
  readonly currentTheme: () => ThemeOption;
  readonly currentLanguage: () => LanguageOption;
  readonly handleSettingsClick: (event: MouseEvent) => void;
  readonly handleSettingsMouseDown: (event: MouseEvent) => void;
  readonly handleToolbarKeyDown: (event: KeyboardEvent) => void;
  readonly handlePanelMouseDown: (event: MouseEvent) => void;
  readonly handlePanelClick: (event: MouseEvent) => void;
  readonly handleThemeChange: (event: Event) => void;
  readonly handleLanguageChange: (event: Event) => void;
}
