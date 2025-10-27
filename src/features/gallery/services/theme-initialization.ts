/**
 * @fileoverview Theme Initialization Service
 * @description 테마 초기화: 시스템 감지 → localStorage 복원 → DOM 적용
 * @module features/gallery/services/theme-initialization
 */

import { logger } from '../../../shared/logging';

/**
 * 테마 모드 타입
 */
export type ThemeMode = 'light' | 'dark';

/**
 * 테마 설정 타입 (자동 또는 명시적 설정)
 */
export type ThemeSetting = 'auto' | ThemeMode;

/**
 * 안전한 localStorage 접근
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
 * 시스템 테마 감지
 *
 * `prefers-color-scheme` 미디어 쿼리를 통해 시스템 다크모드 설정을 감지합니다.
 *
 * @returns 감지된 테마 모드 ('light' | 'dark')
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
 * 저장된 테마 설정 복원
 *
 * localStorage에서 'xeg-theme' 키로 저장된 테마 설정을 가져옵니다.
 *
 * @returns 저장된 테마 설정 또는 null
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
    logger.warn('[theme] Failed to read saved theme:', error);
  }

  return null;
}

/**
 * 테마를 DOM에 적용
 *
 * `document.documentElement`에 `data-theme` 속성을 설정합니다.
 *
 * @param theme - 적용할 테마 모드
 */
export function applyThemeToDOM(theme: ThemeMode): void {
  if (typeof document === 'undefined') {
    return;
  }

  try {
    document.documentElement.setAttribute('data-theme', theme);
    logger.debug(`[theme] Applied: ${theme}`);
  } catch (error) {
    logger.error('[theme] Failed to apply theme to DOM:', error);
  }
}

/**
 * 테마 설정 결정 및 적용
 *
 * 'auto' 설정이면 시스템 테마를 감지하여 적용하고,
 * 명시적 설정이면 그 설정값을 적용합니다.
 *
 * @param setting - 테마 설정
 * @returns 최종 적용된 테마 모드
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
 * 테마 동기 초기화
 *
 * 갤러리 렌더링 전에 호출되어야 합니다.
 * 저장된 설정을 복원하거나, auto인 경우 시스템 테마를 감지하여 적용합니다.
 *
 * @returns 적용된 테마 모드
 *
 * @example
 * ```typescript
 * // 갤러리 초기화 전에 호출
 * const theme = initializeTheme();
 *
 * // 이제 툴바가 렌더링될 때 올바른 배경색이 적용됨
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
 * 시스템 테마 변경 리스너 등록
 *
 * 시스템 테마 변경을 감지하여 auto 모드일 때 자동으로 업데이트합니다.
 * 반환된 함수를 호출하여 리스너를 제거할 수 있습니다.
 *
 * @param onThemeChange - 테마 변경 시 실행할 콜백
 * @returns 리스너 제거 함수
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
