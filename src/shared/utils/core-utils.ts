/**
 * @fileoverview 핵심 유틸리티 통합 모듈
 * @description DOM, 이벤트, 성능 관련 핵심 유틸리티들을 하나의 파일로 통합
 * @version 1.0.0 - Simplification Phase 1
 */

import { logger } from '@shared/logging';
import { isInsideGallery } from './dom';

// DOM 유틸리티는 dom.ts에서 재export
export {
  safeQuerySelector,
  safeQuerySelectorAll,
  isInsideGallery,
  isGalleryContainer,
  isGalleryInternalEvent,
} from './dom';

// ================================
// 유틸리티 함수들
// ================================

/**
 * 갤러리 이벤트를 블록해야 하는지 확인
 */
export function shouldBlockGalleryEvent(event: Event): boolean {
  const target = event.target as HTMLElement;
  return isInsideGallery(target);
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

// DOM 관련 함수들은 @shared/dom/DOMService로 통합됨

// ================================
// 스타일 유틸리티
// ================================
// CSS 유틸리티 (from StyleManager)
// ================================

import StyleManager from '@shared/styles/style-service';

/**
 * CSS 변수 설정 (core-utils 호환성 유지)
 * @deprecated StyleManager.setCSSVariable() 직접 사용 권장
 */
export const setCSSVariable = StyleManager.setCSSVariable;

/**
 * 여러 CSS 변수 설정 (core-utils 호환성 유지)
 * @deprecated StyleManager.setCSSVariables() 직접 사용 권장
 */
export const setCSSVariables = StyleManager.setCSSVariables;

// ================================
// 성능 유틸리티
// ================================

// ================================
// Performance utilities re-export
// ================================

// RAF throttle and scroll throttle from performance module
export { throttleScroll } from '@shared/utils/performance/unified-performance-utils';

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
export { measureAsyncPerformance } from '@shared/utils/performance/unified-performance-utils';

// ================================
// 디버그 유틸리티
// ================================
// Debug utilities re-export
// ================================

export { galleryDebugUtils } from './debug/gallery-debug';

// ================================
// Performance utilities re-export
// ================================

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
