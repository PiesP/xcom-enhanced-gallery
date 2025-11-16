/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Theme Initialization Service
 * @description Handles theme initialization and system theme detection.
 * Manages the flow: system detection → localStorage restoration → DOM application.
 * @module features/gallery/services/theme-initialization
 * @version 1.0.0
 */

import { THEME_DOM_ATTRIBUTE, THEME_STORAGE_KEY } from '@shared/constants';
import { logger } from '@shared/logging';

/**
 * Theme mode type
 * @readonly
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Theme setting type (automatic or explicit mode)
 * @readonly
 */
export type ThemeSetting = 'auto' | ThemeMode;

/**
 * Valid theme setting values
 */
const VALID_THEME_VALUES: readonly ThemeSetting[] = ['auto', 'light', 'dark'];

function normalizeThemeSetting(value: string | null): ThemeSetting | null {
  if (!value) {
    return null;
  }

  if (VALID_THEME_VALUES.includes(value as ThemeSetting)) {
    return value as ThemeSetting;
  }

  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === 'string' && VALID_THEME_VALUES.includes(parsed as ThemeSetting)) {
      return parsed as ThemeSetting;
    }
  } catch {
    // value was not JSON encoded – fall through to null
  }

  return null;
}

/**
 * Safe localStorage access
 *
 * Safely accesses globalThis.localStorage.
 * Returns null if the environment doesn't support localStorage or if an error occurs.
 *
 * @returns localStorage object or null if not available
 */
function getSafeLocalStorage(): Storage | null {
  try {
    const storage = globalThis.localStorage;
    void storage.length;
    return storage ?? null;
  } catch {
    return null;
  }
}

/**
 * Detect system theme preference
 *
 * Uses `prefers-color-scheme` media query to detect system dark mode setting.
 * Falls back to 'light' if detection fails or is not supported.
 *
 * @returns Detected theme mode: 'dark' (system dark mode) or 'light' (default)
 */
export function detectSystemTheme(): ThemeMode {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }

  try {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  } catch (error) {
    logger.warn('[theme] Failed to detect system theme:', error);
    return 'light';
  }
}

/**
 * Restore saved theme setting
 *
 * Retrieves the saved theme setting from localStorage.
 * Returns null if no valid setting is found or storage is not accessible.
 *
 * @returns Saved theme setting ('auto' | 'light' | 'dark') or null
 */
export function getSavedThemeSetting(): ThemeSetting | null {
  try {
    const storage = getSafeLocalStorage();
    if (!storage) {
      return null;
    }
    const saved = storage.getItem(THEME_STORAGE_KEY);
    const normalized = normalizeThemeSetting(saved);
    if (normalized) {
      return normalized;
    }
  } catch (error) {
    logger.debug('[theme] Failed to read saved theme (using default):', error);
  }

  return null;
}

/**
 * Apply theme to DOM
 *
 * Sets the `data-theme` attribute on `document.documentElement` so CSS can select the appropriate theme.
 *
 * @param theme Theme mode to apply ('light' | 'dark')
 */
export function applyThemeToDOM(theme: ThemeMode): void {
  if (typeof document === 'undefined') {
    return;
  }

  try {
    document.documentElement.setAttribute(THEME_DOM_ATTRIBUTE, theme);
    logger.debug(`[theme] Applied: ${theme}`);
  } catch (error) {
    logger.error('[theme] Failed to apply theme to DOM:', error);
  }
}

/**
 * Resolve theme setting and apply to DOM
 *
 * - 'auto' setting: Detects and applies system theme
 * - Explicit setting ('light' | 'dark'): Applies the specified setting directly
 *
 * @param setting Theme setting ('auto' | 'light' | 'dark')
 * @returns Final theme mode applied ('light' | 'dark')
 */
export function resolveAndApplyTheme(setting: ThemeSetting): ThemeMode {
  let resolvedTheme: ThemeMode;

  if (setting === 'auto') {
    resolvedTheme = detectSystemTheme();
    logger.debug(`[theme] Auto resolved to: ${resolvedTheme}`);
  } else {
    resolvedTheme = setting;
    logger.debug(`[theme] Using explicit: ${resolvedTheme}`);
  }

  applyThemeToDOM(resolvedTheme);
  return resolvedTheme;
}

/**
 * Synchronously initialize theme
 *
 * Must be called before gallery rendering (to prevent FOUC - Flash of Unstyled Content).
 *
 * Process:
 * 1. Restore saved setting from localStorage
 * 2. Use 'auto' if no saved setting exists
 * 3. Resolve and apply theme to DOM
 *
 * @returns Applied theme mode ('light' | 'dark')
 *
 * @example
 * ```typescript
 * // Call at the start of GalleryApp initialization
 * const theme = initializeTheme();
 * // Now document.documentElement has data-theme attribute set
 * ```
 */
export function initializeTheme(): ThemeMode {
  logger.info('[theme] Initializing theme');

  // 1. 저장된 설정 복원
  const savedSetting = getSavedThemeSetting();
  const setting: ThemeSetting = savedSetting ?? 'auto';

  logger.debug(`[theme] Setting: ${setting}`);

  // 2. 테마 결정 및 적용
  const appliedTheme = resolveAndApplyTheme(setting);

  logger.info(`[theme] ✅ Theme initialized: ${appliedTheme}`);

  return appliedTheme;
}

/**
 * Register system theme change listener
 *
 * Detects system theme changes and automatically updates when in 'auto' mode.
 * Returns a cleanup function to remove the listener (call on component unmount).
 *
 * @param onThemeChange Callback function to execute when theme changes
 * @returns Cleanup function to remove the listener
 *
 * @example
 * ```typescript
 * // Register listener
 * const cleanup = setupThemeChangeListener((newTheme) => {
 *   console.log('Theme changed to:', newTheme);
 * });
 *
 * // Clean up (e.g., on component unmount)
 * cleanup();
 * ```
 */
export function setupThemeChangeListener(onThemeChange: (theme: ThemeMode) => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => void 0;
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handler = (event: MediaQueryListEvent): void => {
    const savedSetting = getSavedThemeSetting();
    if (savedSetting === 'auto' || savedSetting === null) {
      const newTheme = event.matches ? 'dark' : 'light';
      applyThemeToDOM(newTheme);
      onThemeChange(newTheme);
      logger.debug(`[theme] System theme changed to: ${newTheme}`);
    }
  };

  try {
    mediaQuery.addEventListener('change', handler);
    logger.debug('[theme] Change listener registered');

    return () => {
      mediaQuery.removeEventListener('change', handler);
      logger.debug('[theme] Change listener removed');
    };
  } catch (error) {
    logger.warn('[theme] Failed to setup change listener:', error);
    return () => void 0;
  }
}
