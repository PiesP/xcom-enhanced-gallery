/**
 * @fileoverview Toolbar Settings Controller Hook - Type Definitions
 * @description Type definitions for use-toolbar-settings-controller hook
 *
 * @version 11.0.0
 * @internal Solid.js hook types
 */

import type { LanguageService } from '@shared/services/language-service';
import type { ThemeServiceContract } from '@shared/services/theme-service';

export type ThemeOption = 'auto' | 'light' | 'dark';
export type LanguageOption = 'auto' | 'ko' | 'en' | 'ja';

/**
 * Configuration options for useToolbarSettingsController hook
 *
 * @property isSettingsExpanded - Signal getter for expanded state
 * @property setSettingsExpanded - Signal setter for expanded state
 * @property toggleSettingsExpanded - Function to toggle expanded state
 * @property documentRef - Optional document reference (defaults to global document)
 * @property themeService - Optional ThemeService instance (uses default if not provided)
 * @property languageService - Optional LanguageService instance (uses default if not provided)
 * @property focusDelayMs - Delay in ms for auto-focus (default: 50ms)
 * @property selectChangeGuardMs - Delay in ms for select guard (default: 300ms)
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
 *
 * Contains ref assigners for DOM elements and event handlers for UI interactions
 *
 * @property assignToolbarRef - Assign ref to toolbar container element
 * @property assignSettingsPanelRef - Assign ref to settings panel element
 * @property assignSettingsButtonRef - Assign ref to settings button element
 * @property isSettingsExpanded - Signal getter for expanded state
 * @property currentTheme - Signal getter for current theme
 * @property currentLanguage - Signal getter for current language
 * @property handleSettingsClick - Click handler for settings button
 * @property handleSettingsMouseDown - Mouse down handler for settings button
 * @property handleToolbarKeyDown - Key down handler for toolbar container
 * @property handlePanelMouseDown - Mouse down handler for settings panel
 * @property handlePanelClick - Click handler for settings panel
 * @property handleThemeChange - Change handler for theme select
 * @property handleLanguageChange - Change handler for language select
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
