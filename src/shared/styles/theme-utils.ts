/**
 * @fileoverview 테마 관련 유틸리티 함수들
 * @description X.com Enhanced Gallery의 테마 및 CSS 변수 헬퍼 함수들
 * @version 2.0.0 (TypeScript strict mode 강화)
 */

/**
 * 브라우저 환경 여부 확인
 * @internal
 */
function isBrowser(): boolean {
  return typeof document !== 'undefined' && typeof window !== 'undefined';
}

/**
 * CSS 변수 값을 가져오는 헬퍼 함수
 * @param variableName - CSS 변수 이름 (--xeg- 접두어 제외)
 * @returns CSS 변수 값 (존재하지 않으면 빈 문자열)
 * @example
 * ```ts
 * const primaryColor = getXEGVariable('color-primary-500');
 * const spacing = getXEGVariable('spacing-md');
 * ```
 */
export function getXEGVariable(variableName: string): string {
  if (!isBrowser()) return '';

  try {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(`--xeg-${variableName}`)
      .trim();
  } catch {
    return '';
  }
}

/**
 * 갤러리 테마 설정 유틸리티
 * @param theme - 설정할 테마 타입
 * @description 갤러리 루트 요소에 `data-theme` 속성을 설정합니다.
 * @example
 * ```ts
 * setGalleryTheme('dark');    // Dark mode 활성화
 * setGalleryTheme('auto');    // 시스템 설정 따르기
 * ```
 */
export function setGalleryTheme(theme: Theme): void {
  if (!isBrowser()) return;

  const galleryRoot = document.querySelector('.xeg-root') as HTMLElement | null;
  if (galleryRoot) {
    galleryRoot.setAttribute('data-theme', theme);
  }
}

/**
 * 갤러리 격리 확인 유틸리티
 * @param element - 확인할 DOM 요소
 * @returns 요소가 갤러리 내부에 있으면 true, 외부면 false
 * @example
 * ```ts
 * if (isInsideGallery(element)) {
 *   // 갤러리 내부의 요소
 *   applyGalleryStyles(element);
 * }
 * ```
 */
export function isInsideGallery(element: Element | null): boolean {
  if (!element) return false;
  return element.closest('.xeg-root') !== null;
}

// 스타일 시스템 상수
export const STYLE_CONSTANTS = {
  NAMESPACE: 'xeg',
  ROOT_CLASS: 'xeg-root',
  GALLERY_CLASS: 'xeg-gallery-container',
  OVERLAY_CLASS: 'xeg-gallery-overlay',
  THEMES: ['light', 'dark', 'auto'] as const,
} as const;

export type Theme = (typeof STYLE_CONSTANTS.THEMES)[number];
