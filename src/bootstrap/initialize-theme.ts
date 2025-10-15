/**
 * @fileoverview Theme Initialization Utility
 * @description 갤러리 초기화 전 테마를 동기적으로 설정하는 유틸리티
 *
 * Phase 35 Step 1-B: GREEN 단계
 *
 * 목표:
 * - 컴포넌트 렌더링 전에 테마 설정
 * - 동기적 테마 감지 및 적용
 * - 저장된 테마 preference 복원
 */

import { logger } from '../shared/logging/logger';

function getSafeLocalStorage(): Storage | null {
  try {
    const storage = globalThis.localStorage;
    void storage.length;
    return storage ?? null;
  } catch {
    return null;
  }
}

export type ThemeMode = 'light' | 'dark';
export type ThemeSetting = 'auto' | ThemeMode;

/**
 * 시스템 테마를 감지합니다
 */
export function detectSystemTheme(): ThemeMode {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }

  try {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  } catch (error) {
    logger.warn('[initializeTheme] Failed to detect system theme:', error);
    return 'light';
  }
}

/**
 * 저장된 테마 설정을 가져옵니다
 */
export function getSavedThemeSetting(): ThemeSetting | null {
  try {
    const storage = getSafeLocalStorage();
    if (!storage) {
      return null;
    }
    const saved = storage.getItem('xeg-theme') as ThemeSetting | null;
    if (saved && ['auto', 'light', 'dark'].includes(saved)) {
      return saved;
    }
  } catch (error) {
    logger.warn('[initializeTheme] Failed to read saved theme:', error);
  }

  return null;
}

/**
 * 테마를 DOM에 적용합니다
 */
export function applyThemeToDOM(theme: ThemeMode): void {
  if (typeof document === 'undefined') {
    return;
  }

  try {
    document.documentElement.setAttribute('data-theme', theme);
    logger.debug(`[initializeTheme] Applied theme: ${theme}`);
  } catch (error) {
    logger.error('[initializeTheme] Failed to apply theme to DOM:', error);
  }
}

/**
 * 테마를 결정하고 적용합니다
 */
export function resolveAndApplyTheme(setting: ThemeSetting): ThemeMode {
  let resolvedTheme: ThemeMode;

  if (setting === 'auto') {
    resolvedTheme = detectSystemTheme();
    logger.debug(`[initializeTheme] Auto theme resolved to: ${resolvedTheme}`);
  } else {
    resolvedTheme = setting;
    logger.debug(`[initializeTheme] Using explicit theme: ${resolvedTheme}`);
  }

  applyThemeToDOM(resolvedTheme);
  return resolvedTheme;
}

/**
 * 테마를 동기적으로 초기화합니다
 *
 * @description
 * 이 함수는 갤러리 컴포넌트가 렌더링되기 전에 호출되어야 합니다.
 * 저장된 테마 설정을 복원하거나, auto인 경우 시스템 테마를 감지하여 적용합니다.
 *
 * @returns {ThemeMode} 적용된 테마 모드
 *
 * @example
 * ```typescript
 * // 갤러리 초기화 전에 호출
 * initializeTheme();
 *
 * // 이제 툴바가 렌더링될 때 올바른 배경색이 적용됨
 * ```
 */
export function initializeTheme(): ThemeMode {
  logger.info('[initializeTheme] Starting theme initialization');

  // 1. 저장된 설정 복원
  const savedSetting = getSavedThemeSetting();
  const setting: ThemeSetting = savedSetting ?? 'auto';

  logger.debug(`[initializeTheme] Theme setting: ${setting}`);

  // 2. 테마 결정 및 적용
  const appliedTheme = resolveAndApplyTheme(setting);

  logger.info(`[initializeTheme] Theme initialization complete: ${appliedTheme}`);

  return appliedTheme;
}

/**
 * 테마 변경 이벤트 리스너를 등록합니다
 *
 * @description
 * 시스템 테마 변경을 감지하여 auto 모드일 때 자동으로 업데이트합니다.
 *
 * @returns {() => void} 리스너 제거 함수
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
      logger.debug(`[initializeTheme] System theme changed to: ${newTheme}`);
    }
  };

  try {
    mediaQuery.addEventListener('change', handler);
    logger.debug('[initializeTheme] Theme change listener registered');

    return () => {
      mediaQuery.removeEventListener('change', handler);
      logger.debug('[initializeTheme] Theme change listener removed');
    };
  } catch (error) {
    logger.warn('[initializeTheme] Failed to setup theme change listener:', error);
    return () => void 0;
  }
}
