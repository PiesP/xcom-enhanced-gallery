/**
 * @fileoverview DOM 유틸리티 통합 모듈
 * @version 3.0.0 - Phase 3 통합
 *
 * DOM 조작, 안전한 DOM 접근, 갤러리 요소 감지를 위한 통합 유틸리티
 * - 갤러리 내부 요소 확인
 * - 안전한 DOM 접근 함수들
 * - DOM 조작 헬퍼 함수들
 */

import { logger } from '@core/logging/logger';

// ================================
// 갤러리 요소 감지
// ================================

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

// ================================
// 안전한 DOM 접근 유틸리티
// ================================

/**
 * 안전한 DOM 쿼리 - null 체크 포함
 */
export function safeQuerySelector<T extends Element = Element>(
  selector: string,
  parent: Document | Element = document
): T | null {
  try {
    return parent.querySelector<T>(selector);
  } catch (error) {
    logger.warn(`DOM Utils: Query selector failed for "${selector}":`, error);
    return null;
  }
}

/**
 * 안전한 DOM 쿼리 (모든 요소) - null 체크 포함
 */
export function safeQuerySelectorAll<T extends Element = Element>(
  selector: string,
  parent: Document | Element = document
): T[] {
  try {
    return Array.from(parent.querySelectorAll<T>(selector));
  } catch (error) {
    logger.warn(`DOM Utils: Query selector all failed for "${selector}":`, error);
    return [];
  }
}

/**
 * 안전한 IntersectionObserver 생성
 */
export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') {
    logger.warn('DOM Utils: IntersectionObserver not available');
    return null;
  }

  try {
    return new IntersectionObserver(callback, options);
  } catch (error) {
    logger.warn('DOM Utils: IntersectionObserver creation failed:', error);
    return null;
  }
}

/**
 * 안전한 MutationObserver 생성
 */
export function createMutationObserver(
  callback: MutationCallback,
  _options?: MutationObserverInit
): MutationObserver | null {
  if (typeof MutationObserver === 'undefined') {
    logger.warn('DOM Utils: MutationObserver not available');
    return null;
  }

  try {
    return new MutationObserver(callback);
  } catch (error) {
    logger.warn('DOM Utils: MutationObserver creation failed:', error);
    return null;
  }
}

/**
 * 안전한 요소 속성 조회
 */
export function safeGetAttribute(element: Element | null, attribute: string): string | null {
  if (!element || typeof element.getAttribute !== 'function') {
    return null;
  }

  try {
    return element.getAttribute(attribute);
  } catch (error) {
    logger.warn(`DOM Utils: getAttribute failed for "${attribute}":`, error);
    return null;
  }
}

/**
 * 안전한 요소 속성 설정
 */
export function safeSetAttribute(
  element: Element | null,
  attribute: string,
  value: string
): boolean {
  if (!element || typeof element.setAttribute !== 'function') {
    return false;
  }

  try {
    element.setAttribute(attribute, value);
    return true;
  } catch (error) {
    logger.warn(`DOM Utils: setAttribute failed for "${attribute}":`, error);
    return false;
  }
}

/**
 * 안전한 클래스 추가
 */
export function safeAddClass(element: Element | null, className: string): boolean {
  if (!element?.classList) {
    return false;
  }

  try {
    element.classList.add(className);
    return true;
  } catch (error) {
    logger.warn(`DOM Utils: addClass failed for "${className}":`, error);
    return false;
  }
}

/**
 * 안전한 클래스 제거
 */
export function safeRemoveClass(element: Element | null, className: string): boolean {
  if (!element?.classList) {
    return false;
  }

  try {
    element.classList.remove(className);
    return true;
  } catch (error) {
    logger.warn(`DOM Utils: removeClass failed for "${className}":`, error);
    return false;
  }
}

/**
 * 안전한 스타일 설정
 */
export function safeSetStyle(
  element: HTMLElement | null,
  property: string,
  value: string
): boolean {
  if (!element?.style) {
    return false;
  }

  try {
    element.style.setProperty(property, value);
    return true;
  } catch (error) {
    logger.warn(`DOM Utils: setStyle failed for "${property}":`, error);
    return false;
  }
}

/**
 * 안전한 요소 제거
 */
export function safeRemoveElement(element: Element | null): boolean {
  if (!element?.parentNode) {
    return false;
  }

  try {
    element.parentNode.removeChild(element);
    return true;
  } catch (error) {
    logger.warn('DOM Utils: removeElement failed:', error);
    return false;
  }
}

/**
 * 안전한 이벤트 리스너 추가
 */
export function safeAddEventListener<K extends keyof HTMLElementEventMap>(
  element: HTMLElement | null,
  type: K,
  listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): boolean {
  if (!element || typeof element.addEventListener !== 'function') {
    return false;
  }

  try {
    element.addEventListener(type, listener, options);
    return true;
  } catch (error) {
    logger.warn(`DOM Utils: addEventListener failed for "${type}":`, error);
    return false;
  }
}

/**
 * 안전한 이벤트 리스너 제거
 */
export function safeRemoveEventListener<K extends keyof HTMLElementEventMap>(
  element: HTMLElement | null,
  type: K,
  listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => void,
  options?: boolean | EventListenerOptions
): boolean {
  if (!element || typeof element.removeEventListener !== 'function') {
    return false;
  }

  try {
    element.removeEventListener(type, listener, options);
    return true;
  } catch (error) {
    logger.warn(`DOM Utils: removeEventListener failed for "${type}":`, error);
    return false;
  }
}

/**
 * 요소가 DOM에 연결되어 있는지 확인
 */
export function isElementConnected(element: Element | null): boolean {
  return element?.isConnected ?? false;
}

/**
 * 안전한 getBoundingClientRect
 */
export function safeGetBoundingClientRect(element: Element | null): DOMRect | null {
  if (!element || typeof element.getBoundingClientRect !== 'function') {
    return null;
  }

  try {
    return element.getBoundingClientRect();
  } catch (error) {
    logger.warn('DOM Utils: getBoundingClientRect failed:', error);
    return null;
  }
}
