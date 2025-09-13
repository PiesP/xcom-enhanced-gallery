/**
 * @fileoverview 핵심 유틸리티 통합 모듈
 * @description DOM, 이벤트, 성능 관련 핵심 유틸리티들을 하나의 파일로 통합
 * @version 1.0.0 - Simplification Phase 1
 */

import { logger } from '../logging/logger';

// ================================
// DOM 유틸리티
// ================================

/**
 * 안전한 querySelector 실행
 * 1개 인자: document에서 검색 (기존 API 호환)
 * 2개 인자: 지정된 root에서 검색
 */
export function safeQuerySelector<T extends Element = Element>(
  selectorOrRoot: string | ParentNode,
  selector?: string
): T | null {
  try {
    // 1개 파라미터: document에서 검색 (기존 API 호환)
    if (typeof selectorOrRoot === 'string') {
      return document.querySelector(selectorOrRoot) as T | null;
    }
    // 2개 파라미터: 지정된 root에서 검색
    if (selector) {
      return selectorOrRoot.querySelector(selector) as T | null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 갤러리 내부 요소인지 확인
 */
export function isInsideGallery(element: Element | null): boolean {
  if (!element) return false;

  return (
    element.closest('[data-gallery-container]') !== null ||
    element.closest('.gallery-container') !== null ||
    element.closest('.xeg-gallery-container') !== null ||
    element.closest('#gallery-view') !== null
  );
}

/**
 * 클래스 이름 결합
 */
export function combineClasses(...classes: (string | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * 요소가 갤러리 컨테이너인지 확인
 */
export function isGalleryContainer(element: HTMLElement | null): boolean {
  if (!element) return false;

  const gallerySelectors = [
    '.xeg-gallery-container',
    '.xeg-gallery',
    '[data-xeg-gallery]',
    '.gallery-overlay',
  ];

  return gallerySelectors.some(sel => element.matches(sel));
}

/**
 * 이벤트가 갤러리 내부 이벤트인지 확인
 */
export function isGalleryInternalEvent(event: Event): boolean {
  const target = event.target as HTMLElement;
  return isInsideGallery(target);
}

/**
 * 갤러리 이벤트를 블록해야 하는지 확인
 */
export function shouldBlockGalleryEvent(event: Event): boolean {
  return isGalleryInternalEvent(event);
}

/**
 * 안전한 속성 가져오기
 */
export function safeGetAttribute(el: Element | null, attr: string): string | null {
  try {
    return el?.getAttribute(attr) ?? null;
  } catch {
    return null;
  }
}

/**
 * 안전한 속성 설정
 */
export function safeSetAttribute(el: Element | null, attr: string, value: string): void {
  try {
    el?.setAttribute(attr, value);
  } catch {
    // 오류 무시
  }
}

/**
 * 안전한 클래스 추가
 */
export function safeAddClass(element: Element | null, className: string): void {
  try {
    element?.classList.add(className);
  } catch {
    // Ignore errors
  }
}

/**
 * 안전한 클래스 제거
 */
export function safeRemoveClass(element: Element | null, className: string): void {
  try {
    element?.classList.remove(className);
  } catch {
    // Ignore errors
  }
}

/**
 * 안전한 스타일 설정
 */
export function safeSetStyle(el: HTMLElement | null, style: Partial<CSSStyleDeclaration>): void {
  if (!el) return;
  try {
    Object.assign(el.style, style);
  } catch {
    // 오류 무시
  }
}

/**
 * 안전한 요소 제거
 */
export function safeRemoveElement(el: Element | null): void {
  try {
    el?.parentElement?.removeChild(el);
  } catch {
    // 오류 무시
  }
}

// ================================
// 스타일 유틸리티
// ================================
// CSS 유틸리티 (from css-utilities)
// ================================

import { setCSSVariable as setCSSVarBase } from './styles/css-utilities';

/**
 * CSS 변수 설정 (core-utils compatible signature)
 */
export function setCSSVariable(
  name: string,
  value: string,
  element: HTMLElement = document.documentElement
): void {
  setCSSVarBase(element, name, value);
}

/**
 * 여러 CSS 변수 설정 (core-utils compatible signature)
 */
export function setCSSVariables(
  variables: Record<string, string>,
  element: HTMLElement = document.documentElement
): void {
  Object.entries(variables).forEach(([name, value]) => {
    setCSSVariable(name, value, element);
  });
}

// ================================
// 성능 유틸리티
// ================================

// ================================
// Performance utilities re-export
// ================================

// RAF throttle and scroll throttle from performance module
export { rafThrottle, throttleScroll } from './performance/performance-utils';

// ================================
// 스크롤 유틸리티
// ================================

/**
 * 요소로부터 가장 가까운 스크롤 컨테이너 찾기
 */
export function findScrollContainer(element: HTMLElement): HTMLElement {
  let parent = element.parentElement;

  while (parent) {
    const style = getComputedStyle(parent);
    const overflow = style.overflow + style.overflowY + style.overflowX;

    if (overflow.includes('scroll') || overflow.includes('auto')) {
      return parent;
    }

    parent = parent.parentElement;
  }

  return document.documentElement;
}

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
 * 스크롤 위치 안전 설정
 */
export function safeSetScrollTop(element: HTMLElement | Window, top: number): void {
  try {
    if (element === window) {
      window.scrollTo({ top, behavior: 'smooth' });
    } else {
      (element as HTMLElement).scrollTop = top;
    }
  } catch (error) {
    logger.debug('스크롤 설정 실패:', error);
  }
}

/**
 * 현재 스크롤 위치 가져오기
 */
export function getCurrentScrollTop(element: HTMLElement | Window = window): number {
  try {
    return element === window
      ? window.pageYOffset || document.documentElement.scrollTop
      : (element as HTMLElement).scrollTop;
  } catch {
    return 0;
  }
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

// ================================
// 디버그 유틸리티
// ================================
// Debug utilities re-export
// ================================

export { galleryDebugUtils } from './debug/gallery-debug';

// ================================
// Performance utilities re-export
// ================================

export { Debouncer, createDebouncer } from './performance/performance-utils';

/**
 * Twitter URL에서 트윗 정보 추출
 */
export function extractTweetInfoFromUrl(
  url: string
): { username?: string; tweetId?: string } | null {
  if (!url) return null;

  const twitterUrlPattern = /(?:twitter\.com|x\.com)\/([^/]+)\/status\/(\d+)/;
  const match = url.match(twitterUrlPattern);

  if (!match) return null;

  const [, username, tweetId] = match;
  const result: { username?: string; tweetId?: string } = {};

  if (username) result.username = username;
  if (tweetId) result.tweetId = tweetId;

  return result;
}

/**
 * 문자열 배열 중복 제거
 *
 * @param items - 중복이 있을 수 있는 문자열 배열
 * @returns 중복이 제거된 문자열 배열
 */
export function removeDuplicateStrings(items: readonly string[]): string[] {
  return [...new Set(items)];
}
