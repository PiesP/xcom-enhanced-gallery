/**
 * @fileoverview Scroll Utilities
 * @description 스크롤 관련 유틸리티 함수들
 */

import { logger } from '@shared/logging/logger';
import { Debouncer } from '../performance/performance-utils';

/**
 * 스크롤 핸들러 생성
 */
export function createScrollHandler(
  element: HTMLElement | null,
  options: {
    throttle?: boolean;
    preventBubbling?: boolean;
    onScroll?: (element: HTMLElement) => void;
  } = {}
): () => void {
  if (!element) {
    logger.warn('Cannot create scroll handler: element is null');
    return () => {};
  }

  const { throttle = true, preventBubbling = false, onScroll } = options;

  let isScrolling = false;

  const handleScroll = (e: Event) => {
    if (preventBubbling) {
      e.stopPropagation();
    }

    if (throttle && isScrolling) {
      return;
    }

    isScrolling = true;

    const performScroll = () => {
      onScroll?.(element);
      isScrolling = false;
    };

    if (throttle) {
      requestAnimationFrame(performScroll);
    } else {
      performScroll();
    }
  };

  element.addEventListener('scroll', handleScroll, { passive: true });

  return () => {
    element.removeEventListener('scroll', handleScroll);
  };
}

/**
 * Twitter 스크롤 컨테이너 찾기 (core-utils에서 re-export)
 */
export { findTwitterScrollContainer } from '../core-utils';

/**
 * 갤러리 요소인지 확인
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
 * 스크롤 디바운서 생성 (간편 함수)
 */
export function createScrollDebouncer(callback: () => void, delay: number = 150): Debouncer<[]> {
  return new Debouncer(callback, delay);
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
