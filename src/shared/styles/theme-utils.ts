/**
 * @fileoverview 테마 관련 유틸리티 함수들
 * @description X.com Enhanced Gallery의 테마 및 CSS 변수 헬퍼 함수들
 * @version 1.0.0
 */

/**
 * CSS 변수 값을 가져오는 헬퍼 함수
 * @param variableName - CSS 변수 이름 (--xeg- 접두어 제외)
 * @returns CSS 변수 값
 */
export function getXEGVariable(variableName: string): string {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement)
    .getPropertyValue(`--xeg-${variableName}`)
    .trim();
}

/**
 * 갤러리 테마 설정 유틸리티
 * @param theme - 설정할 테마 ('light' | 'dark' | 'auto')
 */
export function setGalleryTheme(theme: 'light' | 'dark' | 'auto'): void {
  if (typeof document === 'undefined') return;

  const galleryRoot = document.querySelector('.xeg-root');
  if (galleryRoot) {
    galleryRoot.setAttribute('data-theme', theme);
  }
}

/**
 * 갤러리 격리 확인 유틸리티
 * @param element - 확인할 DOM 요소
 * @returns 요소가 갤러리 내부에 있는지 여부
 */
export function isInsideGallery(element: Element): boolean {
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
