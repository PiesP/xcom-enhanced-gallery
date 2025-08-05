/**
 * @fileoverview 핵심 유틸리티 통합 모듈
 * @description DOM, 이벤트, 성능 관련 핵심 유틸리티들을 하나의 파일로 통합
 * @version 1.0.0 - Simplification Phase 1
 */

import { logger } from '@shared/logging/logger';
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
 * 클래스 이름 결합 - StyleManager 사용 권장
 * @deprecated StyleManager.combineClasses를 직접 사용하세요
 */
// export 제거 - StyleManager.combineClasses 사용 권장

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
// CSS 유틸리티 (from UnifiedStyleService)
// ================================

import { getUnifiedStyleService } from '@shared/services/unified-style-service';
const styleService = getUnifiedStyleService();
const setCSSVarBase = styleService.setCSSVariable.bind(styleService);

/**
 * CSS 변수 설정 (core-utils compatible signature)
 */
export function setCSSVariable(
  name: string,
  value: string,
  element: HTMLElement = document.documentElement
): void {
  setCSSVarBase(name, value, element);
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
export { throttleScroll } from '@shared/services/unified-performance-service';

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
export {
  measurePerformance,
  measureAsyncPerformance,
} from '@shared/services/unified-performance-service';

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
