/**
 * @fileoverview 안전한 DOM 접근 유틸리티
 * @version 1.0.0
 *
 * DOM 조작의 안전성을 보장하는 유틸리티 함수들
 */

import { logger } from '@core/logging/logger';

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
    logger.warn('Invalid selector:', { selector, error });
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
    logger.warn('Invalid selector for querySelectorAll:', { selector, error });
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
    logger.warn('IntersectionObserver not supported');
    return null;
  }

  try {
    return new IntersectionObserver(callback, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options,
    });
  } catch (error) {
    logger.error('Failed to create IntersectionObserver:', error);
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
    logger.warn('MutationObserver not supported');
    return null;
  }

  try {
    return new MutationObserver(callback);
  } catch (error) {
    logger.error('Failed to create MutationObserver:', error);
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
    logger.warn('Failed to get attribute:', { attribute, error });
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
    logger.warn('Failed to set attribute:', { attribute, value, error });
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
    logger.warn('Failed to add class:', { className, error });
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
    logger.warn('Failed to remove class:', { className, error });
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
    logger.warn('Failed to set style:', { property, value, error });
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
    logger.warn('Failed to remove element:', error);
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
    logger.warn('Failed to add event listener:', { type, error });
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
    logger.warn('Failed to remove event listener:', { type, error });
    return false;
  }
}

/**
 * 요소가 DOM에 연결되어 있는지 확인
 */
export function isElementConnected(element: Element | null): boolean {
  if (!element) return false;

  // modern browsers
  if ('isConnected' in element) {
    return element.isConnected;
  }

  // fallback for older browsers
  return document.contains(element);
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
    logger.warn('Failed to get bounding client rect:', error);
    return null;
  }
}
