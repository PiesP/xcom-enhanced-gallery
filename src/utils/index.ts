/**
 * @fileoverview 간소화된 Utils 모듈
 * @description Core 모듈 기반의 간단한 유틸리티 함수들
 * @version 2.0.0 - 구조 개선
 */

// Core 모듈에서 필요한 기능들을 re-export
export {
  select,
  selectAll,
  updateElement,
  batchUpdate,
  coreDOMManager,
  combineClasses,
  setCSSVariable,
  getCSSVariable,
  setTheme,
  updateComponentState,
  coreStyleManager,
  extractMediaUrls,
  getHighQualityUrl,
  isValidMediaUrl,
  generateFilename,
  filterMedia,
  coreMediaManager,
  type MediaInfo,
  type MediaType,
  type MediaQuality,
  type DOMUpdate,
  type ComponentState,
  type Theme,
  type GlassmorphismIntensity,
} from '../core';

// 성능 관련 유틸리티만 유지
export { createDebouncer, rafThrottle } from './performance/performance-utils';

// 리소스 관리 유틸리티
export {
  registerResource,
  unregisterResource,
  cleanup,
  cleanupContext,
  type ResourceType,
  type ResourceContext,
} from './resource-manager';

// 타입 안전성 헬퍼들
export {
  safeParseInt,
  safeParseFloat,
  isString,
  isNumber,
  isObject,
  isArray,
  isFunction,
} from './type-safety-helpers';

// 간단한 메모리 관리 (기존 것 유지)
export { TimerManager } from './timer-management';

/**
 * 갤러리 내부 요소인지 확인
 */
export function isGalleryInternalElement(element: Element | null): boolean {
  if (!element) return false;
  return element.closest('.xeg-gallery-container, .xeg-toolbar, .xeg-toast') !== null;
}

/**
 * 갤러리 트리거 가능 여부 확인
 */
export function canTriggerGallery(element: Element | null): boolean {
  if (!element) return false;
  if (isGalleryInternalElement(element)) return false;

  // 트위터/X 미디어 요소인지 확인
  const mediaElement = element.closest(
    '[data-testid="tweetPhoto"], [data-testid="videoComponent"]'
  );
  return mediaElement !== null;
}

/**
 * 트위터 스크롤 컨테이너 찾기
 */
export function findTwitterScrollContainer(): HTMLElement | null {
  // 트위터/X의 메인 스크롤 컨테이너들
  const selectors = [
    '[data-testid="primaryColumn"]',
    'main[role="main"]',
    '[role="main"] > div',
    '.css-1dbjc4n.r-1habvwh',
  ];

  for (const selector of selectors) {
    const container = document.querySelector<HTMLElement>(selector);
    if (container) return container;
  }

  return null;
}

/**
 * 성능 측정 래퍼
 */
export function measurePerformance<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.info(`[PERF] ${name}: ${(end - start).toFixed(2)}ms`);
  return result;
}

/**
 * 스크롤 스로틀링
 */
export function throttleScroll(callback: () => void, delay = 16): () => void {
  let isThrottled = false;

  return () => {
    if (isThrottled) return;

    isThrottled = true;
    requestAnimationFrame(() => {
      callback();
      setTimeout(() => {
        isThrottled = false;
      }, delay);
    });
  };
}

/**
 * 갤러리 스크롤 가능 여부 확인
 */
export function ensureGalleryScrollAvailable(): boolean {
  const scrollContainer = findTwitterScrollContainer();
  return scrollContainer !== null && scrollContainer.scrollHeight > scrollContainer.clientHeight;
}
