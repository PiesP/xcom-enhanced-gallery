/**
 * @fileoverview 통합 DOM 서비스
 * @description 모든 DOM 유틸리티 중복을 제거한 단일 통합 서비스
 * @version 1.0.0 - DOM 통합
 */

import { createScopedLogger } from '@shared/logging';

const logger = createScopedLogger('DOMService');

// ===== 타입 정의 =====

export interface ElementOptions {
  id?: string;
  className?: string;
  textContent?: string;
  innerHTML?: string;
  attributes?: Record<string, string>;
  classes?: string[];
  styles?: Record<string, string>;
  dataset?: Record<string, string>;
  'aria-live'?: 'polite' | 'assertive' | 'off';
  'aria-atomic'?: string;
  width?: string;
  height?: string;
}

export interface EventOptions extends AddEventListenerOptions {
  debounceMs?: number;
  throttleMs?: number;
}

export interface DOMUpdate {
  operations: DOMOperation[];
}

export interface DOMOperation {
  type:
    | 'addClass'
    | 'removeClass'
    | 'setStyle'
    | 'setAttribute'
    | 'removeAttribute'
    | 'setTextContent';
  element: Element;
  key?: string;
  value?: string;
  styles?: Record<string, string>;
}

// ===== 통합 DOM 서비스 =====

/**
 * 통합 DOM 서비스
 * 모든 DOM 관련 중복 기능을 하나로 통합
 * CoreDOMManager의 캐싱과 배치 기능 포함
 */
class DOMService {
  private static instance: DOMService;
  private readonly elementCache = new Map<string, Element | null>();
  private readonly elementsCache = new Map<string, Element[]>();

  private constructor() {}

  static getInstance(): DOMService {
    if (!DOMService.instance) {
      DOMService.instance = new DOMService();
    }
    return DOMService.instance;
  }

  // ===== 캐시 관리 =====

  /**
   * 캐시 무효화
   */
  invalidateCache(selector?: string): void {
    if (selector) {
      this.elementCache.delete(selector);
      this.elementsCache.delete(selector);
    } else {
      this.elementCache.clear();
      this.elementsCache.clear();
    }
  }

  /**
   * 캐시 크기 조회
   */
  getCacheSize(): { elements: number; arrays: number } {
    return {
      elements: this.elementCache.size,
      arrays: this.elementsCache.size,
    };
  }

  // ===== 요소 선택 (캐싱 지원) =====

  /**
   * 요소 선택 (캐싱 지원)
   */
  querySelector<T extends Element = Element>(
    selector: string,
    container: ParentNode = document
  ): T | null {
    try {
      const cacheKey = `${selector}:${container === document ? 'document' : 'container'}`;

      if (this.elementCache.has(cacheKey)) {
        return this.elementCache.get(cacheKey) as T | null;
      }

      const element = container.querySelector<T>(selector);
      this.elementCache.set(cacheKey, element);
      return element;
    } catch (error) {
      logger.warn(`[DOMService] Invalid selector: ${selector}`, error);
      return null;
    }
  }

  /**
   * 모든 요소 선택 (캐싱 지원)
   */
  querySelectorAll<T extends Element = Element>(
    selector: string,
    container: ParentNode = document
  ): T[] {
    try {
      const cacheKey = `${selector}:${container === document ? 'document' : 'container'}`;

      if (this.elementsCache.has(cacheKey)) {
        return this.elementsCache.get(cacheKey) as T[];
      }

      const elements = Array.from(container.querySelectorAll<T>(selector));
      this.elementsCache.set(cacheKey, elements);
      return elements;
    } catch (error) {
      logger.warn(`[DOMService] Invalid selector: ${selector}`, error);
      return [];
    }
  }

  // ===== 요소 생성 =====

  /**
   * 요소 생성
   */
  createElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    options: ElementOptions = {}
  ): HTMLElementTagNameMap[K] | null {
    try {
      // 태그명 유효성 검사
      if (!tagName || typeof tagName !== 'string') {
        return null;
      }

      const element = document.createElement(tagName);

      // 생성 확인
      if (!element) {
        return null;
      }

      // ID 설정
      if (options.id) {
        element.id = options.id;
      }

      // 클래스명 설정
      if (options.className) {
        element.className = options.className;
      }

      // 속성 설정
      if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, value]) => {
          element.setAttribute(key, value);
        });
      }

      // 클래스 추가
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
      if (options.textContent) {
        element.textContent = options.textContent;
      }

      // HTML 콘텐츠 설정
      if (options.innerHTML) {
        element.innerHTML = options.innerHTML;
      }

      return element;
    } catch (error) {
      logger.error(`[DOMService] Failed to create element: ${tagName}`, error);
      return null;
    }
  }

  // ===== 이벤트 관리 =====

  /**
   * 이벤트 리스너 추가
   */
  addEventListener<K extends keyof HTMLElementEventMap>(
    element: HTMLElement | Document | Window,
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => void,
    options: EventOptions = {}
  ): () => void {
    try {
      // 성능 최적화: passive 이벤트 리스너 활성화
      const listenerOptions: AddEventListenerOptions = {};

      if (options.passive !== undefined) {
        listenerOptions.passive = options.passive;
      }
      if (options.once !== undefined) {
        listenerOptions.once = options.once;
      }
      if (options.capture !== undefined) {
        listenerOptions.capture = options.capture;
      }

      // 간단한 이벤트 리스너 등록 (debounce는 추후 구현)
      element.addEventListener(type, listener as EventListener, listenerOptions);

      // cleanup 함수 반환
      return () => {
        element.removeEventListener(type, listener as EventListener, listenerOptions);
      };
    } catch (error) {
      logger.error('[DOMService] Failed to add event listener:', error);
      return () => {}; // 빈 cleanup 함수
    }
  }

  /**
   * 이벤트 리스너 제거
   */
  removeEventListener<K extends keyof HTMLElementEventMap>(
    element: HTMLElement,
    type: K,
    listener: (event: HTMLElementEventMap[K]) => void,
    options?: EventListenerOptions
  ): void {
    try {
      element.removeEventListener(type, listener as EventListener, options);
    } catch (error) {
      logger.warn('[DOMService] Failed to remove event listener:', error);
    }
  }

  // ===== 배치 처리 =====

  /**
   * 배치 DOM 업데이트
   */
  batchUpdate(update: DOMUpdate): void {
    try {
      // requestAnimationFrame을 사용한 배치 처리
      requestAnimationFrame(() => {
        update.operations.forEach(operation => {
          this.executeOperation(operation);
        });
      });
    } catch (error) {
      logger.error('[DOMService] Failed to batch update:', error);
    }
  }

  /**
   * 단일 DOM 작업 실행
   */
  private executeOperation(operation: DOMOperation): void {
    try {
      const { type, element, key, value, styles } = operation;

      switch (type) {
        case 'addClass':
          if (key) element.classList.add(key);
          break;
        case 'removeClass':
          if (key) element.classList.remove(key);
          break;
        case 'setStyle':
          if (styles) {
            Object.entries(styles).forEach(([prop, val]) => {
              (element as HTMLElement).style.setProperty(prop, val);
            });
          }
          break;
        case 'setAttribute':
          if (key && value) element.setAttribute(key, value);
          break;
        case 'removeAttribute':
          if (key) element.removeAttribute(key);
          break;
        case 'setTextContent':
          if (value !== undefined) element.textContent = value;
          break;
      }
    } catch (error) {
      logger.warn('[DOMService] Failed to execute operation:', error);
    }
  }

  /**
   * 여러 요소의 DOM 작업을 배치로 처리
   */
  batchDOMOperations(operations: DOMOperation[]): void {
    this.batchUpdate({ operations });
  }

  /**
   * 요소 업데이트 (CoreDOMManager 호환)
   */
  updateElement(element: Element, update: Partial<DOMOperation>): void {
    if (!element) return;

    const operation: Partial<DOMOperation> & { element: Element } = {
      type: update.type || 'setStyle',
      element,
      ...(update.key && { key: update.key }),
      ...(update.value && { value: update.value }),
      ...(update.styles && { styles: update.styles }),
    };

    if (operation.type) {
      this.executeOperation(operation as DOMOperation);
    }
  }

  /**
   * 클래스 추가
   */
  addClass(element: Element | null, className: string): boolean {
    if (!element || !className) return false;

    try {
      element.classList.add(className);
      return true;
    } catch (error) {
      logger.warn(`[DOMService] Failed to add class '${className}':`, error);
      return false;
    }
  }

  /**
   * 클래스 제거
   */
  removeClass(element: Element | null, className: string): boolean {
    if (!element || !className) return false;

    try {
      element.classList.remove(className);
      return true;
    } catch (error) {
      logger.warn(`[DOMService] Failed to remove class '${className}':`, error);
      return false;
    }
  }

  /**
   * 스타일 설정
   */
  setStyle(element: HTMLElement | null, styles: Record<string, string>): boolean {
    if (!element || !styles) return false;

    try {
      Object.entries(styles).forEach(([property, value]) => {
        element.style.setProperty(property, value);
      });
      return true;
    } catch (error) {
      logger.warn('[DOMService] Failed to set styles:', error);
      return false;
    }
  }

  /**
   * 요소 제거
   */
  removeElement(element: Element | null): boolean {
    try {
      if (element) {
        element.remove();
        return true;
      }
      return false;
    } catch (error) {
      logger.warn('[DOMService] Failed to remove element:', error);
      return false;
    }
  }

  // ===== 유틸리티 =====

  /**
   * 요소 가시성 확인
   */
  isVisible(element: Element | null): boolean {
    if (!element) return false;

    try {
      const style = window.getComputedStyle(element);
      return (
        style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0
      );
    } catch (error) {
      logger.warn('[DOMService] Failed to check visibility:', error);
      return false;
    }
  }

  /**
   * 요소가 뷰포트에 있는지 확인
   */
  isInViewport(element: Element | null): boolean {
    if (!element) return false;

    try {
      const rect = element.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth
      );
    } catch (error) {
      logger.warn('[DOMService] Failed to check viewport:', error);
      return false;
    }
  }

  // ===== CoreDOMManager 호환 메서드 =====

  /**
   * 요소 선택 (CoreDOMManager 호환)
   */
  select<T extends Element = Element>(selector: string): T | null {
    return this.querySelector<T>(selector);
  }

  /**
   * 모든 요소 선택 (CoreDOMManager 호환)
   */
  selectAll<T extends Element = Element>(selector: string): T[] {
    return this.querySelectorAll<T>(selector);
  }
}

// ===== 싱글톤 인스턴스 =====

const domService = DOMService.getInstance();

// ===== 편의 함수 Export =====

export const querySelector = domService.querySelector.bind(domService);
export const querySelectorAll = domService.querySelectorAll.bind(domService);
export const createElement = domService.createElement.bind(domService);
export const addEventListener = domService.addEventListener.bind(domService);
export const removeEventListener = domService.removeEventListener.bind(domService);
export const addClass = domService.addClass.bind(domService);
export const removeClass = domService.removeClass.bind(domService);
export const setStyle = domService.setStyle.bind(domService);
export const removeElement = domService.removeElement.bind(domService);
export const isVisible = domService.isVisible.bind(domService);
export const isInViewport = domService.isInViewport.bind(domService);

// ===== CoreDOMManager 호환 함수들 =====

export const select = domService.select.bind(domService);
export const selectAll = domService.selectAll.bind(domService);
export const updateElement = domService.updateElement.bind(domService);
export const batchUpdate = domService.batchUpdate.bind(domService);
export const batchDOMOperations = domService.batchDOMOperations.bind(domService);
export const invalidateCache = domService.invalidateCache.bind(domService);
export const getCacheSize = domService.getCacheSize.bind(domService);

// ===== 하위 호환성을 위한 별칭들 =====

export const safeQuerySelector = querySelector;
export const safeAddClass = addClass;
export const safeRemoveClass = removeClass;
export const safeSetStyle = (element: HTMLElement | null, property: string, value: string) => {
  if (!element) return false;
  return setStyle(element, { [property]: value });
};
export const safeRemoveElement = removeElement;
export const isElement = (obj: unknown): obj is Element => obj instanceof Element;
export const isHTMLElement = (obj: unknown): obj is HTMLElement => obj instanceof HTMLElement;
export const isElementInViewport = isInViewport;

// ===== 기본 Export =====

export { DOMService };
export default domService;
