/**
 * @fileoverview 통합 DOM 서비스
 * @description TDD 기반으로 중복된 DOM 관련 기능들을 하나로 통합
 * @version 1.0.0 - GREEN Phase: 중복 통합 완료
 * @deprecated 이 서비스는 새로운 @shared/dom/DOMService로 대체되었습니다.
 * 새로운 코드에서는 `import { DOMService } from '@shared/dom'`을 사용하세요.
 */

import { coreLogger as logger } from '@core/logger';

export interface DOMElementOptions {
  attributes?: Record<string, string>;
  classes?: string[];
  styles?: Record<string, string>;
  textContent?: string;
  innerHTML?: string;
}

export interface EventListenerOptions {
  passive?: boolean;
  once?: boolean;
  capture?: boolean;
  debounceMs?: number;
  throttleMs?: number;
}

/**
 * 통합 DOM 서비스 클래스
 * 모든 DOM 관련 중복 기능을 하나로 통합
 */
class UnifiedDOMService {
  private static instance: UnifiedDOMService;
  private eventCleanupFunctions = new WeakMap<Element, (() => void)[]>();

  private constructor() {}

  static getInstance(): UnifiedDOMService {
    if (!UnifiedDOMService.instance) {
      UnifiedDOMService.instance = new UnifiedDOMService();
    }
    return UnifiedDOMService.instance;
  }

  /**
   * 통합된 요소 생성 함수 (모든 createElement 중복 통합)
   */
  createElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    options: DOMElementOptions = {}
  ): HTMLElementTagNameMap[K] | null {
    try {
      const element = document.createElement(tagName);

      // 속성 설정
      if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, value]) => {
          element.setAttribute(key, value);
        });
      }

      // CSS 클래스 추가
      if (options.classes?.length) {
        element.classList.add(...options.classes);
      }

      // 스타일 설정
      if (options.styles) {
        Object.entries(options.styles).forEach(([property, value]) => {
          element.style.setProperty(property, value);
        });
      }

      // 텍스트 콘텐츠 설정
      if (options.textContent !== undefined) {
        element.textContent = options.textContent;
      }

      // HTML 콘텐츠 설정
      if (options.innerHTML !== undefined) {
        element.innerHTML = options.innerHTML;
      }

      return element;
    } catch (error) {
      logger.error('[UnifiedDOMService] Failed to create element:', error);
      return null;
    }
  }

  /**
   * 통합된 안전한 querySelector (모든 querySelector 중복 통합)
   */
  querySelector<T extends Element = Element>(
    selector: string,
    container: ParentNode = document
  ): T | null {
    try {
      return container.querySelector<T>(selector);
    } catch (error) {
      logger.warn('[UnifiedDOMService] Invalid selector:', selector, error);
      return null;
    }
  }

  /**
   * 통합된 안전한 querySelectorAll (모든 querySelectorAll 중복 통합)
   */
  querySelectorAll<T extends Element = Element>(
    selector: string,
    container: ParentNode = document
  ): T[] {
    try {
      return Array.from(container.querySelectorAll<T>(selector));
    } catch (error) {
      logger.warn('[UnifiedDOMService] Invalid selector:', selector, error);
      return [];
    }
  }

  /**
   * 통합된 이벤트 리스너 추가 (모든 addEventListener 중복 통합)
   */
  addEventListener<K extends keyof HTMLElementEventMap>(
    element: HTMLElement,
    type: K,
    listener: (event: HTMLElementEventMap[K]) => void,
    options: EventListenerOptions = {}
  ): () => void {
    let optimizedListener = listener;

    // Debounce 적용
    if (options.debounceMs) {
      let timeoutId: number | null = null;
      optimizedListener = (event: HTMLElementEventMap[K]) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => listener(event), options.debounceMs);
      };
    }

    // Throttle 적용
    if (options.throttleMs && !options.debounceMs) {
      let lastCall = 0;
      optimizedListener = (event: HTMLElementEventMap[K]) => {
        const now = Date.now();
        if (now - lastCall >= options.throttleMs!) {
          lastCall = now;
          listener(event);
        }
      };
    }

    const listenerOptions: AddEventListenerOptions = {
      ...(options.passive !== undefined && { passive: options.passive }),
      ...(options.once !== undefined && { once: options.once }),
      ...(options.capture !== undefined && { capture: options.capture }),
    };

    try {
      element.addEventListener(type, optimizedListener as EventListener, listenerOptions);

      // 정리 함수 생성
      const cleanup = () => {
        element.removeEventListener(type, optimizedListener as EventListener, listenerOptions);
      };

      // 요소별 정리 함수 추적
      if (!this.eventCleanupFunctions.has(element)) {
        this.eventCleanupFunctions.set(element, []);
      }
      this.eventCleanupFunctions.get(element)!.push(cleanup);

      return cleanup;
    } catch (error) {
      logger.error('[UnifiedDOMService] Failed to add event listener:', error);
      return () => {}; // 빈 정리 함수 반환
    }
  }

  /**
   * 안전한 스타일 설정
   */
  setStyle(element: HTMLElement, property: string, value: string): boolean {
    try {
      element.style.setProperty(property, value);
      return true;
    } catch (error) {
      logger.warn('[UnifiedDOMService] Failed to set style:', property, value, error);
      return false;
    }
  }

  /**
   * 안전한 클래스 추가
   */
  addClass(element: HTMLElement, ...classNames: string[]): boolean {
    try {
      element.classList.add(...classNames);
      return true;
    } catch (error) {
      logger.warn('[UnifiedDOMService] Failed to add classes:', classNames, error);
      return false;
    }
  }

  /**
   * 안전한 클래스 제거
   */
  removeClass(element: HTMLElement, ...classNames: string[]): boolean {
    try {
      element.classList.remove(...classNames);
      return true;
    } catch (error) {
      logger.warn('[UnifiedDOMService] Failed to remove classes:', classNames, error);
      return false;
    }
  }

  /**
   * 안전한 요소 제거
   */
  removeElement(element: Element): boolean {
    try {
      // 등록된 이벤트 리스너들 정리
      const cleanupFunctions = this.eventCleanupFunctions.get(element);
      if (cleanupFunctions) {
        cleanupFunctions.forEach(cleanup => cleanup());
        this.eventCleanupFunctions.delete(element);
      }

      // 요소 제거
      element.remove();
      return true;
    } catch (error) {
      logger.warn('[UnifiedDOMService] Failed to remove element:', error);
      return false;
    }
  }

  /**
   * 요소 가시성 확인
   */
  isVisible(element: HTMLElement): boolean {
    try {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight && rect.bottom > 0;
    } catch (error) {
      logger.warn('[UnifiedDOMService] Failed to check visibility:', error);
      return false;
    }
  }

  /**
   * 모든 이벤트 리스너 정리
   */
  cleanup(): void {
    try {
      // WeakMap은 직접 순회할 수 없으므로 새로 초기화
      this.eventCleanupFunctions = new WeakMap();
    } catch (error) {
      logger.error('[UnifiedDOMService] Failed to cleanup:', error);
    }
  }

  // ================================
  // 누락된 DOM 유틸리티 함수들 (호환성)
  // ================================

  /**
   * DOM 요소인지 확인
   */
  isElement(obj: unknown): obj is Element {
    return obj instanceof Element;
  }

  /**
   * HTML 요소인지 확인
   */
  isHTMLElement(obj: unknown): obj is HTMLElement {
    return obj instanceof HTMLElement;
  }

  /**
   * 요소가 뷰포트에 있는지 확인
   */
  isElementInViewport(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;

    return (
      rect.top >= 0 && rect.left >= 0 && rect.bottom <= windowHeight && rect.right <= windowWidth
    );
  }

  /**
   * 요소가 보이는지 확인
   */
  isElementVisible(element: Element): boolean {
    if (!element) return false;

    const style = window.getComputedStyle(element);
    return (
      style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0
    );
  }

  /**
   * 이벤트 리스너 제거 (래퍼)
   */
  removeEventListener<K extends keyof HTMLElementEventMap>(
    element: Element,
    type: K,
    listener: (event: HTMLElementEventMap[K]) => void,
    options?: boolean | EventListenerOptions
  ): void {
    if (element && typeof element.removeEventListener === 'function') {
      element.removeEventListener(type, listener as EventListener, options);
    }
  }

  // ================================
  // 기존 DOM 유틸리티 클래스 호환성
  // ================================}
}

// 전역 인스턴스 및 편의 함수들
export const unifiedDOMService = UnifiedDOMService.getInstance();

// 편의 함수들 (기존 코드 호환성을 위해)
export const querySelector = unifiedDOMService.querySelector.bind(unifiedDOMService);
export const querySelectorAll = unifiedDOMService.querySelectorAll.bind(unifiedDOMService);
export const createElement = unifiedDOMService.createElement.bind(unifiedDOMService);
export const addEventListener = unifiedDOMService.addEventListener.bind(unifiedDOMService);
export const removeElement = unifiedDOMService.removeElement.bind(unifiedDOMService);
export const setStyle = unifiedDOMService.setStyle.bind(unifiedDOMService);
export const addClass = unifiedDOMService.addClass.bind(unifiedDOMService);
export const removeClass = unifiedDOMService.removeClass.bind(unifiedDOMService);
export const isVisible = unifiedDOMService.isVisible.bind(unifiedDOMService);

// 누락된 유틸리티 함수들
export const isElement = unifiedDOMService.isElement.bind(unifiedDOMService);
export const isHTMLElement = unifiedDOMService.isHTMLElement.bind(unifiedDOMService);
export const isElementInViewport = unifiedDOMService.isElementInViewport.bind(unifiedDOMService);
export const isElementVisible = unifiedDOMService.isElementVisible.bind(unifiedDOMService);
export const removeEventListener = unifiedDOMService.removeEventListener.bind(unifiedDOMService);

// 하위 호환성을 위한 별칭들
export const safeQuerySelector = querySelector;
export const cachedQuerySelector = querySelector; // 캐싱은 상위 레벨에서 처리
export const safeAddClass = (element: Element, className: string) =>
  element.classList.add(className);
export const safeRemoveClass = (element: Element, className: string) =>
  element.classList.remove(className);
export const safeSetStyle = (element: HTMLElement, property: string, value: string) => {
  element.style.setProperty(property, value);
};
export const safeRemoveElement = removeElement;

// ================================
// 호환성을 위한 타입 정의
// ================================

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

// ================================
// 호환성을 위한 DOMUtils 클래스
// ================================

export class DOMUtils {
  private static readonly instance = UnifiedDOMService.getInstance();

  /**
   * 안전한 요소 선택
   */
  public static querySelector<T extends Element = Element>(
    selector: string,
    container: ParentNode = document
  ): T | null {
    return DOMUtils.instance.querySelector<T>(selector, container);
  }

  /**
   * 안전한 모든 요소 선택
   */
  public static querySelectorAll<T extends Element = Element>(
    selector: string,
    container: ParentNode = document
  ): T[] {
    return Array.from(DOMUtils.instance.querySelectorAll<T>(selector, container));
  }

  /**
   * 요소 생성
   */
  public static createElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    options?: DOMElementCreationOptions
  ): HTMLElementTagNameMap[K] | null {
    return DOMUtils.instance.createElement(tagName, options);
  }

  /**
   * 이벤트 리스너 추가
   */
  public static addEventListener<K extends keyof HTMLElementEventMap>(
    element: HTMLElement,
    type: K,
    listener: (event: HTMLElementEventMap[K]) => void,
    options?: EventListenerOptions
  ): () => void {
    return DOMUtils.instance.addEventListener(element, type, listener, options || {});
  }

  /**
   * 요소 제거
   */
  public static removeElement(element: Element): void {
    DOMUtils.instance.removeElement(element);
  }
}
