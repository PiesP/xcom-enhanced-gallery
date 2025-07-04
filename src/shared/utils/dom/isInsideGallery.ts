/**
 * @fileoverview DOM utils for gallery event handling
 * @version 1.0.0
 *
 * 갤러리 이벤트 처리를 위한 DOM 유틸리티 함수들
 */

import { logger } from '@infrastructure/logging/logger';

/**
 * 갤러리 내부 요소인지 확인하는 CSS 선택자들
 */
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
  // 갤러리 컴포넌트들
  '.xeg-toolbar',
  '.xeg-button',
  '.gallery-controls',
  '.gallery-toolbar',
  '.gallery-header',
  '.gallery-footer',
  '.gallery-content',
  '.gallery-item',
  '.media-viewer',
  // 토스트 및 UI 요소들
  '.xeg-toast-container',
  '.xeg-toast',
  '.toast-container',
  '.notification',
] as const;

/**
 * 요소가 갤러리 내부 요소인지 확인
 *
 * @param element - 확인할 DOM 요소
 * @returns 갤러리 내부 요소인지 여부
 */
export function isInsideGallery(element: HTMLElement | null): boolean {
  if (!element) return false;

  try {
    // 모든 갤러리 선택자에 대해 확인
    for (const selector of GALLERY_SELECTORS) {
      if (element.matches?.(selector) || element.closest?.(selector)) {
        logger.debug('DOM utils: Element is inside gallery', {
          element: element.tagName,
          selector,
        });
        return true;
      }
    }

    return false;
  } catch (error) {
    logger.warn('DOM utils: Error checking gallery element:', error);
    return false;
  }
}

/**
 * 갤러리 컨테이너 직접 요소인지 확인
 *
 * @param element - 확인할 DOM 요소
 * @returns 갤러리 컨테이너인지 여부
 */
export function isGalleryContainer(element: HTMLElement | null): boolean {
  if (!element) return false;

  try {
    const containerSelectors = [
      '.xeg-gallery-container',
      '[data-xeg-gallery-container]',
      '.gallery-container',
      '.xeg-gallery',
    ];

    return containerSelectors.some(selector => {
      try {
        return element.matches?.(selector);
      } catch {
        return false;
      }
    });
  } catch (error) {
    logger.warn('DOM utils: Error checking gallery container:', error);
    return false;
  }
}

/**
 * 이벤트가 갤러리 내부에서 발생했는지 확인
 *
 * @param event - 마우스 이벤트
 * @returns 갤러리 내부 이벤트인지 여부
 */
export function isGalleryInternalEvent(event: MouseEvent): boolean {
  const target = event.target as HTMLElement | null;
  return isInsideGallery(target);
}

/**
 * 갤러리 열림 상태에서 클릭 이벤트를 차단해야 하는지 확인
 *
 * @param event - 마우스 이벤트
 * @returns 이벤트를 차단해야 하는지 여부
 */
export function shouldBlockGalleryEvent(event: MouseEvent): boolean {
  // 좌클릭이 아닌 경우 차단
  if (event.button !== 0) {
    return true;
  }

  // 갤러리 내부 이벤트인 경우 차단
  if (isGalleryInternalEvent(event)) {
    logger.debug('DOM utils: Blocking gallery internal event');
    return true;
  }

  return false;
}
