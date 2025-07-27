/**
 * @fileoverview 핵심 유틸리티 통합 모듈
 * @description DOM, 이벤트, 성능, 스타일 유틸리티를 단일 파일로 통합
 * @version 1.0.0 - Simplification Phase 1
 */

import { logger } from '@shared/logging/logger';

// ================================
// DOM 유틸리티
// ================================

// 갤러리 요소 감지를 위한 선택자 목록
const GALLERY_SELECTORS = [
  '.xeg-gallery-container',
  '[data-gallery-element]',
  '#xeg-gallery-root',
  '.vertical-gallery-view',
  '[data-xeg-gallery-container]',
  '[data-xeg-gallery]',
  '.xeg-vertical-gallery',
  '.xeg-gallery',
  '.gallery-container',
  '[data-gallery]',
  '.xeg-toolbar',
  '.xeg-button',
  '.gallery-controls',
  '.gallery-toolbar',
  '.gallery-header',
  '.gallery-footer',
  '.gallery-content',
  '.gallery-item',
  '.media-viewer',
  '.xeg-toast-container',
  '.xeg-toast',
  '.toast-container',
  '.notification',
] as const;

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
 * 리소스 해제
 */
export function releaseResource(id: string): boolean {
  // 실제 리소스 관리 로직이 필요하면 여기에 구현
  console.info(`Releasing resource: ${id}`);
  return true;
}

/**
 * 요소가 갤러리 내부에 있는지 확인
 */

/**
 * 요소가 갤러리 컨테이너인지 확인
 */
export function isGalleryContainer(element: HTMLElement | null): boolean {
  if (!element) return false;
  return GALLERY_SELECTORS.some(sel => element.matches(sel));
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

/**
 * CSS 변수 설정
 */
export function setCSSVariable(
  name: string,
  value: string,
  element: HTMLElement = document.documentElement
): void {
  element.style.setProperty(name.startsWith('--') ? name : `--${name}`, value);
}

/**
 * 여러 CSS 변수 설정
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

/**
 * RAF 기반 throttle (최고 성능)
 */
export function rafThrottle<T extends unknown[]>(
  fn: (...args: T) => void,
  options: { leading?: boolean; trailing?: boolean } = {}
): (...args: T) => void {
  const { leading = true, trailing = true } = options;
  let isThrottled = false;
  let pendingArgs: T | null = null;

  function throttled(this: unknown, ...args: T): void {
    pendingArgs = args;

    if (!isThrottled) {
      if (leading) {
        try {
          fn(...args);
        } catch (error) {
          logger.warn('RAF throttle function error:', error);
        }
      }

      isThrottled = true;
      requestAnimationFrame(() => {
        isThrottled = false;
        if (trailing && pendingArgs) {
          try {
            fn(...pendingArgs);
          } catch (error) {
            logger.warn('RAF throttle trailing function error:', error);
          }
        }
        pendingArgs = null;
      });
    }
  }

  return throttled;
}

/**
 * 스크롤 이벤트용 throttle (기본값)
 */
export function throttleScroll<T extends unknown[]>(
  fn: (...args: T) => void
): (...args: T) => void {
  return rafThrottle(fn, { leading: true, trailing: true });
}

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

interface PerformanceMeasurement {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
}

/**
 * 성능 측정 함수
 */
export function measurePerformance<T>(
  name: string,
  fn: () => T
): { result: T; measurement: PerformanceMeasurement } {
  const startTime = performance.now();
  const result = fn();
  const endTime = performance.now();
  const duration = endTime - startTime;

  const measurement: PerformanceMeasurement = {
    name,
    duration,
    startTime,
    endTime,
  };

  if (duration > 100) {
    logger.warn(`Performance warning: ${name} took ${duration.toFixed(2)}ms`);
  } else {
    logger.debug(`Performance: ${name} took ${duration.toFixed(2)}ms`);
  }

  return { result, measurement };
}

// ================================
// 디버그 유틸리티
// ================================

/**
 * 갤러리 디버그 유틸리티
 */
export const galleryDebugUtils = {
  /**
   * 갤러리 컨테이너 상태 진단
   */
  diagnoseContainer(): void {
    const container = document.querySelector('.xeg-gallery-container');

    if (!container) {
      console.info('❌ Gallery container not found');
      return;
    }

    const style = window.getComputedStyle(container);
    const rect = container.getBoundingClientRect();

    const diagnosis = {
      visible: style.display !== 'none' && style.visibility !== 'hidden',
      dimensions: `${rect.width}x${rect.height}`,
      position: `${rect.top}, ${rect.left}`,
      children: container.children.length,
      inViewport: rect.width > 0 && rect.height > 0,
    };

    console.info('🔍 Gallery container status:', diagnosis);
  },

  /**
   * 갤러리 강제 표시
   */
  forceShow(): void {
    const container = document.querySelector('.xeg-gallery-container') as HTMLElement;

    if (!container) {
      console.warn('Cannot force show: container not found');
      return;
    }

    // 기본적인 스타일 강제 적용
    container.style.display = 'block';
    container.style.visibility = 'visible';
    container.style.opacity = '1';

    console.info('✅ Gallery forced to show');
  },
};

// ================================
// 디바운서 클래스
// ================================

/**
 * 디바운서 클래스 - 중복 실행 방지
 */
export class Debouncer<T extends unknown[] = unknown[]> {
  private timerId: number | null = null;
  private lastArgs: T | null = null;

  constructor(
    private readonly fn: (...args: T) => void,
    private readonly delay: number
  ) {}

  execute(...args: T): void {
    this.lastArgs = args;
    this.clearTimer();
    this.timerId = window.setTimeout(() => {
      if (this.lastArgs) {
        this.fn(...this.lastArgs);
        this.lastArgs = null;
      }
    }, this.delay);
  }

  flush(): void {
    if (this.lastArgs) {
      this.clearTimer();
      this.fn(...this.lastArgs);
      this.lastArgs = null;
    }
  }

  cancel(): void {
    this.clearTimer();
    this.lastArgs = null;
  }

  isPending(): boolean {
    return this.timerId !== null;
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}

/**
 * 디바운서 팩토리 함수
 */
export function createDebouncer<T extends unknown[]>(
  fn: (...args: T) => void,
  delay: number
): Debouncer<T> {
  return new Debouncer(fn, delay);
}

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
 * 문자열 배열에서 중복 제거
 */
export function removeDuplicateStrings(strings: string[]): string[] {
  return [...new Set(strings)];
}
