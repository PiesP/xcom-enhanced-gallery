/**
 * @fileoverview 핵심 유틸리티 통합 모듈
 * @description DOM, 이벤트, 성능 관련 핵심 유틸리티들을 하나의 파일로 통합
 * @version 2.0.0 - Phase 326.7: Unused function removal
 */

import { isHTMLElement } from './type-guards';

// ================================
// DOM 유틸리티
// ================================

/**
 * 갤러리 내부 요소 여부 확인
 * @param element - 검사할 요소 (null 안전)
 * @returns element가 갤러리 내부이면 true
 * @example
 * ```typescript
 * if (isInsideGallery(target)) {
 *   return; // 갤러리 내부 이벤트 무시
 * }
 * ```
 */
function isInsideGallery(element: Element | null): boolean {
  if (!element) return false;

  return (
    element.closest('[data-gallery-container]') !== null ||
    element.closest('.gallery-container') !== null ||
    element.closest('.xeg-gallery-container') !== null ||
    element.closest('#gallery-view') !== null
  );
}

/**
 * 이벤트가 갤러리 내부 이벤트인지 확인
 * Phase 241: event.target 타입 가드 적용
 * @param event - 검사할 이벤트
 * @returns 이벤트의 target이 갤러리 내부이면 true
 */
export function isGalleryInternalEvent(event: Event): boolean {
  const target = event.target;
  if (!isHTMLElement(target)) return false;
  return isInsideGallery(target);
}

// ================================
// 성능 유틸리티
// ================================

// RAF throttle and scroll throttle from performance module
export { rafThrottle, throttleScroll } from './performance/performance-utils';

// ================================
// 스크롤 유틸리티
// ================================

/**
 * Twitter 스크롤 컨테이너 찾기
 */
export function findTwitterScrollContainer(): HTMLElement | null {
  const selectors = [
    '[data-testid="primaryColumn"]',
    'main[role="main"]',
    '.css-1dbjc4n[data-at-shortcutkeys]',
    'body',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      return element;
    }
  }

  return document.body;
}

/**
 * 갤러리 스크롤 보장 함수
 */
export function ensureGalleryScrollAvailable(element: HTMLElement | null): void {
  if (!element) {
    return;
  }

  // 스크롤 가능한 요소들을 찾고 기본 스크롤 활성화
  const scrollableElements = element.querySelectorAll(
    '[data-xeg-role="items-list"], .itemsList, .content'
  ) as NodeListOf<HTMLElement>;

  scrollableElements.forEach(el => {
    if (el.style.overflowY !== 'auto' && el.style.overflowY !== 'scroll') {
      el.style.overflowY = 'auto';
    }
  });
}

// ================================
// 성능 측정 유틸리티
// ================================

// Performance measurement re-export
export { measurePerformance, measureAsyncPerformance } from './performance/performance-utils';

// Performance utilities re-export
export { Debouncer, createDebouncer } from './performance/performance-utils';

/**
 * 문자열 배열 중복 제거
 *
 * @param items - 중복이 있을 수 있는 문자열 배열
 * @returns 중복이 제거된 문자열 배열
 */
export function removeDuplicateStrings(items: readonly string[]): string[] {
  return [...new Set(items)];
}
