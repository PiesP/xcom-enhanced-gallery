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
 * 스토리지 키 - 테마 설정 저장 위치
 */
const THEME_STORAGE_KEY = 'xeg-theme';

/**
 * DOM 속성명 - 테마 적용 대상
 */
const THEME_DOM_ATTRIBUTE = 'data-theme';

/**
 * 유효한 테마 설정값 목록
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
 * 안전한 localStorage 접근
 *
 * globalThis.localStorage에 안전하게 접근합니다.
 * 접근 불가능한 환경이거나 오류 발생 시 null을 반환합니다.
 *
 * @returns localStorage 객체 또는 null
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
 * 초기화 실패 시 기본값 'light'를 반환합니다.
 *
 * @returns 감지된 테마 모드: 'dark' (시스템 다크모드) 또는 'light' (기본값)
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
 * localStorage에서 저장된 테마 설정을 가져옵니다.
 * 저장된 값이 유효하지 않거나 접근 불가능하면 null을 반환합니다.
 *
 * @returns 저장된 테마 설정 ('auto' | 'light' | 'dark') 또는 null
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
 * 테마를 DOM에 적용
 *
 * `document.documentElement`에 `data-theme` 속성을 설정하여 CSS에서 테마를 선택할 수 있도록 합니다.
 *
 * @param theme - 적용할 테마 모드 ('light' | 'dark')
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
 * 테마 설정 결정 및 적용
 *
 * - 'auto' 설정: 시스템 테마를 감지하여 적용
 * - 명시적 설정 ('light' | 'dark'): 그 설정값을 직접 적용
 *
 * @param setting - 테마 설정 ('auto' | 'light' | 'dark')
 * @returns 최종 적용된 테마 모드 ('light' | 'dark')
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
 * 갤러리 렌더링 전에 호출되어야 합니다 (FOUC 방지).
 *
 * 프로세스:
 * 1. localStorage에서 저장된 설정 복원
 * 2. 설정이 없으면 'auto' 사용
 * 3. 설정에 따라 테마 결정 및 DOM 적용
 *
 * @returns 적용된 테마 모드 ('light' | 'dark')
 *
 * @example
 * ```typescript
 * // GalleryApp 초기화 시 가장 먼저 호출
 * const theme = initializeTheme();
 * // 이제 DOM의 data-theme 속성이 설정되어 있음
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
 * 시스템 테마 변경을 감지하여 'auto' 모드일 때 자동으로 업데이트합니다.
 * 반환된 함수를 호출하여 리스너를 제거할 수 있습니다 (cleanup).
 *
 * @param onThemeChange - 테마 변경 시 실행할 콜백 함수
 * @returns 리스너 제거 함수 (사용 후 호출 권장)
 *
 * @example
 * ```typescript
 * // 리스너 등록
 * const cleanup = setupThemeChangeListener((newTheme) => {
 *   console.log('Theme changed to:', newTheme);
 * });
 *
 * // 정리 (컴포넌트 언마운트 시 등)
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
