/**
 * @fileoverview Basic DOM Utilities - 함수형 API
 * @version 2.1.0 - Phase 138.1: 함수형 전환 (클래스 제거)
 *
 * Tree-shaking 친화적인 순수 함수형 유틸리티
 */

import { logger } from '../../logging/logger';

// ========== 타입 정의 ==========

export interface DOMElementCreationOptions {
  /** HTML 속성들 */
  attributes?: Record<string, string>;
  /** 텍스트 콘텐츠 */
  textContent?: string;
  /** CSS 클래스들 */
  classes?: string[];
  /** 스타일 속성들 */
  styles?: Record<string, string>;
}

// ========== 요소 선택 및 검증 ==========

/**
 * 안전한 요소 선택 (CSS 선택자)
 * @template T - 반환할 요소 타입 (기본값: Element)
 * @param selector - CSS 선택자 문자열
 * @param container - 검색 범위 (기본값: document)
 * @returns 찾은 첫 번째 요소 또는 null (잘못된 선택자도 null 반환)
 * @example
 * ```typescript
 * const button = querySelector<HTMLButtonElement>('button.primary');
 * const container = querySelector('#gallery', document.body);
 * ```
 */
export function querySelector<T extends Element = Element>(
  selector: string,
  container: ParentNode = document
): T | null {
  try {
    return container.querySelector<T>(selector);
  } catch (error) {
    logger.warn(`[DOM] Invalid selector: ${selector}`, error);
    return null;
  }
}

/**
 * 안전한 모든 요소 선택 (CSS 선택자)
 * @template T - 반환할 요소 타입 (기본값: Element)
 * @param selector - CSS 선택자 문자열
 * @param container - 검색 범위 (기본값: document)
 * @returns NodeList (요소 없으면 빈 NodeList, 잘못된 선택자도 빈 NodeList)
 * @example
 * ```typescript
 * const buttons = querySelectorAll<HTMLButtonElement>('.btn');
 * buttons.forEach(btn => btn.disabled = true);
 * ```
 */
export function querySelectorAll<T extends Element = Element>(
  selector: string,
  container: ParentNode = document
): NodeListOf<T> {
  try {
    return container.querySelectorAll<T>(selector);
  } catch (error) {
    logger.warn(`[DOM] Invalid selector: ${selector}`, error);
    return document.createElement('div').querySelectorAll<T>('');
  }
}

/**
 * 요소 존재 여부 확인
 * @param selector - CSS 선택자 문자열
 * @param container - 검색 범위 (기본값: document)
 * @returns 요소가 존재하면 true, 없거나 선택자가 잘못되면 false
 * @example
 * ```typescript
 * if (elementExists('.modal.open')) {
 *   closeModal();
 * }
 * ```
 */
export function elementExists(selector: string, container: ParentNode = document): boolean {
  return querySelector(selector, container) !== null;
}

// ========== 요소 생성 및 조작 ==========

/**
 * 안전한 요소 생성
 * @template K - HTML 요소 태그명 타입
 * @param tagName - 생성할 HTML 요소 태그명 (예: 'div', 'button')
 * @param options - 요소 생성 옵션 (속성, 클래스, 스타일 등)
 * @returns 생성된 요소 또는 null (생성 실패 시)
 * @example
 * ```typescript
 * const btn = createElement('button', {
 *   classes: ['btn', 'btn-primary'],
 *   attributes: { type: 'button', 'aria-label': 'Close' },
 *   textContent: 'Click me'
 * });
 * ```
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  options: DOMElementCreationOptions = {}
): HTMLElementTagNameMap[K] | null {
  try {
    const element = document.createElement(tagName);

    // 속성 설정
    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }

    // 텍스트 콘텐츠 설정
    if (options.textContent) {
      element.textContent = options.textContent;
    }

    // CSS 클래스 추가
    if (options.classes) {
      element.classList.add(...options.classes);
    }

    // 스타일 설정
    if (options.styles) {
      Object.entries(options.styles).forEach(([property, value]) => {
        element.style.setProperty(property, value);
      });
    }

    return element;
  } catch (error) {
    logger.error(`[DOM] Failed to create element: ${tagName}`, error);
    return null;
  }
}

/**
 * 안전한 요소 제거
 * @param element - 제거할 요소 (null 시 무시)
 * @returns 제거 성공 여부
 * @example
 * ```typescript
 * const removed = removeElement(element);
 * if (removed) console.log('Element removed');
 * ```
 */
export function removeElement(element: Element | null): boolean {
  try {
    if (element?.parentNode) {
      element.parentNode.removeChild(element);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('[DOM] Failed to remove element:', error);
    return false;
  }
}

// ========== 이벤트 관리 ==========

/**
 * 안전한 이벤트 리스너 추가
 * @param element - 대상 요소 (null 시 무시)
 * @param type - 이벤트 타입 (예: 'click', 'keydown')
 * @param listener - 이벤트 핸들러 함수
 * @param options - 리스너 옵션 (capture, once 등)
 * @returns 등록 성공 여부
 * @example
 * ```typescript
 * const success = addEventListener(button, 'click', handleClick);
 * addEventListener(document, 'scroll', handleScroll, { capture: true });
 * ```
 */
export function addEventListener(
  element: Element | null,
  type: string,
  listener: EventListener,
  options?: AddEventListenerOptions
): boolean {
  try {
    if (element) {
      element.addEventListener(type, listener, options);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('[DOM] Failed to add event listener:', error);
    return false;
  }
}

/**
 * 안전한 이벤트 리스너 제거
 * @param element - 대상 요소 (null 시 무시)
 * @param type - 이벤트 타입 (추가할 때와 동일)
 * @param listener - 이벤트 핸들러 함수 (추가할 때와 동일)
 * @param options - 리스너 옵션 (추가할 때와 동일)
 * @returns 제거 성공 여부
 * @example
 * ```typescript
 * removeEventListener(button, 'click', handleClick);
 * ```
 */
export function removeEventListener(
  element: Element | null,
  type: string,
  listener: EventListener,
  options?: EventListenerOptions
): boolean {
  try {
    if (element) {
      element.removeEventListener(type, listener, options);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('[DOM] Failed to remove event listener:', error);
    return false;
  }
}

// ========== 요소 검증 ==========

/**
 * Element 타입 가드
 */
export function isElement(obj: unknown): obj is Element {
  return obj instanceof Element;
}

/**
 * HTMLElement 타입 가드
 */
export function isHTMLElement(obj: unknown): obj is HTMLElement {
  return obj instanceof HTMLElement;
}

/**
 * 요소 가시성 확인
 */
export function isElementVisible(element: Element | null): boolean {
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

/**
 * 요소가 뷰포트 내에 있는지 확인
 */
export function isElementInViewport(element: Element | null): boolean {
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// ========== 디버깅 ==========

/**
 * 디버그 정보 반환
 */
export function getDebugInfo(): Record<string, unknown> {
  return {
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    document: {
      readyState: document.readyState,
      URL: document.URL,
    },
    scroll: {
      x: window.scrollX,
      y: window.scrollY,
    },
  };
}
