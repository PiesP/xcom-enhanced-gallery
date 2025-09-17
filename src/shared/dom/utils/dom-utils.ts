/**
 * @fileoverview Basic DOM Utilities
 * @version 2.0.0
 *
 * 이 모듈은 기본적인 DOM 조작 기능만 제공합니다.
 */

import { logger } from '@shared/logging';

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

// ========== DOM 유틸리티 클래스 ==========

export class DOMUtils {
  // ========== 요소 선택 및 검증 ==========

  /**
   * 안전한 요소 선택
   */
  public static querySelector<T extends Element = Element>(
    selector: string,
    container: ParentNode = document
  ): T | null {
    try {
      return container.querySelector<T>(selector);
    } catch (error) {
      logger.warn(`[DOMUtils] Invalid selector: ${selector}`, error);
      return null;
    }
  }

  /**
   * 안전한 모든 요소 선택
   */
  public static querySelectorAll<T extends Element = Element>(
    selector: string,
    container: ParentNode = document
  ): NodeListOf<T> {
    try {
      return container.querySelectorAll<T>(selector);
    } catch (error) {
      logger.warn(`[DOMUtils] Invalid selector: ${selector}`, error);
      return document.createElement('div').querySelectorAll<T>(''); // 빈 NodeList 반환
    }
  }

  /**
   * 요소 존재 여부 확인
   */
  public static elementExists(selector: string, container: ParentNode = document): boolean {
    return this.querySelector(selector, container) !== null;
  }

  // ========== 요소 생성 및 조작 ==========

  /**
   * 안전한 요소 생성
   */
  public static createElement<K extends keyof HTMLElementTagNameMap>(
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
      logger.error(`[DOMUtils] Failed to create element: ${tagName}`, error);
      return null;
    }
  }

  /**
   * 안전한 요소 제거
   */
  public static removeElement(element: Element | null): boolean {
    try {
      if (element?.parentNode) {
        element.parentNode.removeChild(element);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('[DOMUtils] Failed to remove element:', error);
      return false;
    }
  }

  // ========== 이벤트 관리 ==========

  /**
   * 안전한 이벤트 리스너 추가
   */
  public static addEventListener(
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
      logger.error('[DOMUtils] Failed to add event listener:', error);
      return false;
    }
  }

  /**
   * 안전한 이벤트 리스너 제거
   */
  public static removeEventListener(
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
      logger.error('[DOMUtils] Failed to remove event listener:', error);
      return false;
    }
  }

  // ========== 요소 검증 ==========

  /**
   * Element 타입 가드
   */
  public static isElement(obj: unknown): obj is Element {
    return obj instanceof Element;
  }

  /**
   * HTMLElement 타입 가드
   */
  public static isHTMLElement(obj: unknown): obj is HTMLElement {
    return obj instanceof HTMLElement;
  }

  /**
   * 요소 가시성 확인
   */
  public static isElementVisible(element: Element | null): boolean {
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  /**
   * 요소가 뷰포트 내에 있는지 확인
   */
  public static isElementInViewport(element: Element | null): boolean {
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
  public static getDebugInfo(): Record<string, unknown> {
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
}

// ========== 편의를 위한 named export ==========

export const {
  querySelector,
  querySelectorAll,
  createElement,
  removeElement,
  addEventListener,
  removeEventListener,
  isElement,
  isHTMLElement,
  isElementVisible,
  isElementInViewport,
} = DOMUtils;

// ========== 기본 export ==========

export default DOMUtils;
