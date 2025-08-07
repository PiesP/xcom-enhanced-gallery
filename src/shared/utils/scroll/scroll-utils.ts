/**
 * @fileoverview Scroll Utilities
 */

import { logger } from '@shared/logging';
import { debounce } from '@shared/utils/performance/unified-performance-utils';
import { unifiedDOMService } from '@shared/dom/unified-dom-service';

/** Twitter 스크롤 컨테이너 찾기 */
export { findTwitterScrollContainer } from '../core-utils';

/** 갤러리 요소인지 확인 */
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

/** 스크롤 디바운서 생성 */
export function createScrollDebouncer(callback: () => void, delay: number = 150) {
  return debounce(callback, delay);
}

/**
 * 스크롤 전파 방지
 */
export function preventScrollPropagation(element: HTMLElement): () => void {
  const handleWheel = (e: Event) => {
    e.stopPropagation();
  };

  const cleanup = unifiedDOMService.addEventListener(element, 'wheel', handleWheel, {
    passive: false,
  } as AddEventListenerOptions);

  return cleanup;
}

/**
 * 스크롤 이벤트 처리기 생성
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

  const targetElement = captureOnDocument ? (document as unknown as Element) : element;

  try {
    const cleanup = unifiedDOMService.addEventListener(targetElement, 'wheel', wheelHandler, {
      passive: false,
    } as AddEventListenerOptions);
    logger.debug('Wheel event listener registered', {
      target: captureOnDocument ? 'document' : 'element',
      threshold,
    });

    return () => {
      try {
        cleanup();
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
