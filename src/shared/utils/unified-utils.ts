/**
 * @fileoverview 통합 유틸리티 - Phase 4 최종 결과물
 * @version 4.0.0 - 완전 통합 버전
 *
 * 기존에 분산되어 있던 모든 공통 유틸리티들을 하나의 파일로 통합
 * - 성능 유틸리티 (debounce, throttle, RAF)
 * - 스타일 유틸리티 (클래스 조작, CSS 변수)
 * - 스크롤 유틸리티 (핸들링, 컨테이너 검색)
 * - 디버그 유틸리티 (갤러리 진단)
 * - 중복 제거 유틸리티
 */

import { logger } from '@core/logging/logger';
import type { MediaInfo } from '@core/types/media.types';

// ================================
// Performance Utilities
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
 * RAF 기반 throttle (성능 최적화)
 */
export function rafThrottle<T extends (...args: unknown[]) => void>(
  fn: T,
  options: { leading?: boolean; trailing?: boolean } = {}
): T {
  const { leading = true, trailing = true } = options;
  let isThrottled = false;
  let pendingArgs: Parameters<T> | null = null;

  function throttled(...args: Parameters<T>): void {
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

  return throttled as T;
}

/**
 * 스크롤 전용 throttle
 */
export function throttleScroll<T extends (...args: unknown[]) => void>(func: T): T {
  return rafThrottle(func, { leading: true, trailing: true });
}

/**
 * 성능 측정 유틸리티
 */
export function measurePerformance<T>(label: string, fn: () => T): { result: T; duration: number } {
  const startTime = performance.now();
  const result = fn();
  const endTime = performance.now();
  const duration = endTime - startTime;

  if (duration > 10) {
    logger.debug(`Performance: ${label} took ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}

/**
 * 비동기 성능 측정
 */
export async function measureAsyncPerformance<T>(
  label: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  const duration = endTime - startTime;

  if (duration > 10) {
    logger.debug(`Async Performance: ${label} took ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}

// ================================
// Style Utilities
// ================================

/**
 * 클래스명 결합 유틸리티
 */
export function combineClasses(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * 클래스 토글 유틸리티
 */
export function toggleClass(element: HTMLElement, className: string, condition?: boolean): void {
  element.classList.toggle(className, condition);
}

/**
 * CSS 변수 설정
 */
export function setCSSVariable(element: HTMLElement, variable: string, value: string): void {
  const varName = variable.startsWith('--') ? variable : `--${variable}`;
  element.style.setProperty(varName, value);
}

/**
 * CSS 변수 일괄 설정
 */
export function setCSSVariables(element: HTMLElement, variables: Record<string, string>): void {
  Object.entries(variables).forEach(([variable, value]) => {
    setCSSVariable(element, variable, value);
  });
}

/**
 * 컴포넌트 상태 업데이트
 */
export function updateComponentState(
  element: HTMLElement,
  baseClass: string,
  states: Record<string, boolean>
): void {
  Object.entries(states).forEach(([state, active]) => {
    const stateClass = `${baseClass}--${state}`;
    toggleClass(element, stateClass, active);
  });
}

/**
 * 테마 클래스명 생성
 */
export function createThemedClassName(baseClass: string, theme: string = 'auto'): string {
  return `${baseClass} ${baseClass}--theme-${theme}`;
}

// ================================
// Scroll Utilities
// ================================

/**
 * 스크롤 핸들러 생성
 */
export function createScrollHandler(
  element: HTMLElement,
  callback: (deltaY: number, event: WheelEvent) => void,
  options: {
    threshold?: number;
    captureOnDocument?: boolean;
  } = {}
): () => void {
  const { threshold = 0, captureOnDocument = false } = options;

  const wheelHandler = (event: Event) => {
    const wheelEvent = event as WheelEvent;
    if (Math.abs(wheelEvent.deltaY) > threshold) {
      try {
        callback(wheelEvent.deltaY, wheelEvent);
      } catch (error) {
        logger.error('Scroll handler execution failed', error);
      }
    }
  };

  const targetElement = captureOnDocument ? document : element;

  try {
    targetElement.addEventListener('wheel', wheelHandler, { passive: false });
    logger.debug('Wheel event listener registered', {
      target: captureOnDocument ? 'document' : 'element',
      threshold,
    });

    return () => {
      try {
        targetElement.removeEventListener('wheel', wheelHandler);
        logger.debug('Wheel event listener removed');
      } catch (error) {
        logger.warn('Event listener removal failed', error);
      }
    };
  } catch (error) {
    logger.error('Event listener registration failed', error);
    return () => {}; // noop cleanup function
  }
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
      logger.debug('Twitter scroll container found:', selector);
      return element;
    }
  }

  logger.warn('No Twitter scroll container found, using body');
  return document.body;
}

/**
 * 갤러리 요소인지 확인
 */
export function isGalleryElement(element: HTMLElement | null): boolean {
  if (!element) {
    return false;
  }

  const gallerySelectors = [
    '.xeg-gallery-container',
    '[data-xeg-gallery]',
    '[data-xeg-role]',
    '.xeg-media-viewer',
    '.xeg-items-list',
  ];

  return gallerySelectors.some(selector => element.matches(selector) || element.closest(selector));
}

/**
 * 스크롤 디바운서 생성 (간편 함수)
 */
export function createScrollDebouncer(callback: () => void, delay: number = 150): Debouncer<[]> {
  return createDebouncer(callback, delay);
}

/**
 * 갤러리 스크롤 보장 함수 (단순화)
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

/**
 * 스크롤 전파 방지
 */
export function preventScrollPropagation(
  element: HTMLElement,
  options: { disableBodyScroll?: boolean } = {}
): () => void {
  const { disableBodyScroll = false } = options;

  const handleWheel = (e: Event) => {
    e.stopPropagation();
    if (disableBodyScroll) {
      e.preventDefault();
    }
  };

  element.addEventListener('wheel', handleWheel, { passive: false });

  return () => {
    element.removeEventListener('wheel', handleWheel);
  };
}

// ================================
// Deduplication Utilities
// ================================

/**
 * 범용 중복 제거 함수
 */
export function removeDuplicates<T>(items: readonly T[], keyExtractor: (item: T) => string): T[] {
  if (!items?.length) {
    return [];
  }

  const seen = new Set<string>();
  const uniqueItems: T[] = [];

  for (const item of items) {
    if (!item) {
      continue;
    }

    const key = keyExtractor(item);
    if (!key) {
      logger.warn('Skipping item without key');
      continue;
    }

    if (!seen.has(key)) {
      seen.add(key);
      uniqueItems.push(item);
    }
  }

  return uniqueItems;
}

/**
 * 문자열 배열 중복 제거
 */
export function removeDuplicateStrings(items: readonly string[]): string[] {
  return removeDuplicates(items, item => item);
}

/**
 * 미디어 아이템 중복 제거
 */
export function removeDuplicateMediaItems(mediaItems: readonly MediaInfo[]): MediaInfo[] {
  const result = removeDuplicates(mediaItems, item => item.url);

  // 성능 최적화를 위해 실제로 제거된 경우만 로깅
  const removedCount = mediaItems.length - result.length;
  if (removedCount > 0) {
    logger.debug('Removed duplicate media items:', {
      original: mediaItems.length,
      unique: result.length,
      removed: removedCount,
    });
  }

  return result;
}

// ================================
// Debug Utilities
// ================================

/**
 * 갤러리 디버깅 유틸리티 (단순화된 버전)
 */
export const galleryDebugUtils = {
  /**
   * 갤러리 컨테이너 상태 진단
   */
  diagnoseContainer(): void {
    const container = document.querySelector('.xeg-gallery-container');

    if (!container) {
      logger.info('❌ Gallery container not found');
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

    logger.info('🔍 Gallery container status:', diagnosis);
  },

  /**
   * 갤러리 강제 표시 (단순화)
   */
  forceShow(): void {
    const container = document.querySelector('.xeg-gallery-container') as HTMLElement;

    if (!container) {
      logger.warn('Cannot force show: container not found');
      return;
    }

    // 기본적인 스타일 강제 적용
    container.style.display = 'block';
    container.style.visibility = 'visible';
    container.style.opacity = '1';

    logger.info('✅ Gallery forced to show');
  },
};

// ================================
// Unified Export Object
// ================================

/**
 * 모든 유틸리티를 포함하는 통합 객체
 */
export const unifiedUtils = {
  // Performance
  createDebouncer,
  rafThrottle,
  throttleScroll,
  measurePerformance,
  measureAsyncPerformance,

  // Style
  combineClasses,
  toggleClass,
  setCSSVariable,
  setCSSVariables,
  updateComponentState,
  createThemedClassName,

  // Scroll
  createScrollHandler,
  findTwitterScrollContainer,
  isGalleryElement,
  createScrollDebouncer,
  ensureGalleryScrollAvailable,
  preventScrollPropagation,

  // Deduplication
  removeDuplicates,
  removeDuplicateStrings,
  removeDuplicateMediaItems,

  // Debug
  galleryDebugUtils,
} as const;
