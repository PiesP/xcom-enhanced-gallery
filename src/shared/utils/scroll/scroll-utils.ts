/**
 * @fileoverview Scroll Utilities
 * @description 스크롤 이벤트 및 갤러리 요소 검사 유틸리티
 */

import { logger } from '../../logging/logger';
import { Debouncer } from '../performance/performance-utils';

/** Twitter 스크롤 컨테이너 찾기 */
export { findTwitterScrollContainer } from '../core-utils';

/**
 * 갤러리 요소 여부 확인
 * @param element - 검사할 HTML 요소 (null 안전)
 * @returns element가 갤러리 요소이면 true
 * @example
 * ```typescript
 * if (isGalleryElement(target)) {
 *   // gallery-specific handling
 * }
 * ```
 */
export function isGalleryElement(element: HTMLElement | null): boolean {
  if (!element) return false;

  const gallerySelectors = [
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
  ];

  return gallerySelectors.some(selector => {
    try {
      return element.matches(selector) || element.closest(selector) !== null;
    } catch {
      return false;
    }
  });
}

/**
 * 스크롤 디바운서 생성
 * @param callback - 스크롤 완료 후 호출할 함수
 * @param delay - 대기 시간 (기본값: 150ms)
 * @returns Debouncer 인스턴스
 * @example
 * ```typescript
 * const debouncer = createScrollDebouncer(() => {
 *   console.log('Scrolling stopped');
 * }, 200);
 * ```
 */
export function createScrollDebouncer(callback: () => void, delay: number = 150): Debouncer<[]> {
  return new Debouncer(callback, delay);
}

// Re-export throttleScroll from performance utils (RAF-based, more efficient)
export { throttleScroll } from '../performance/performance-utils';

/**
 * 스크롤 이벤트 처리기 생성
 * @param element - 이벤트 리스너 등록 대상 요소
 * @param callback - 스크롤 감지 시 호출할 함수 (deltaY, event 전달)
 * @param options - 핸들러 옵션 (threshold, captureOnDocument)
 * @returns 리스너 제거 함수
 * @example
 * ```typescript
 * const remove = createScrollHandler(element, (deltaY) => {
 *   console.log(`Scrolled: ${deltaY}px`);
 * }, { threshold: 10 });
 *
 * // 나중에 리스너 제거
 * remove();
 * ```
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
    targetElement.addEventListener('wheel', wheelHandler, { passive: true });
    logger.debug('Wheel event listener registered', {
      target: captureOnDocument ? 'document' : 'element',
      threshold,
    });

    return () => {
      try {
        targetElement.removeEventListener('wheel', wheelHandler);
        logger.debug('Wheel event listener removed');
      } catch (error) {
        logger.error('Failed to remove wheel event listener', error);
      }
    };
  } catch (error) {
    logger.error('Event listener registration failed', error);
    return () => {}; // noop cleanup function
  }
}
