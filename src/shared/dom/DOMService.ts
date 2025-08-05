/**
 * @fileoverview 통합 DOM 서비스
 * @description 모든 DOM 유틸리티 중복을 제거한 단일 통합 서비스
 * @version 1.0.0 - DOM 통합
 */

import { logger } from '@shared/logging';

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

// ===== 통합 DOM 서비스 =====

/**
 * 통합 DOM 서비스
 * 모든 DOM 관련 중복 기능을 하나로 통합
 */
class DOMService {
  private static instance: DOMService;

  private constructor() {}

  static getInstance(): DOMService {
    if (!DOMService.instance) {
      DOMService.instance = new DOMService();
    }
    return DOMService.instance;
  }

  // ===== 요소 선택 =====

  /**
   * 요소 선택
   */
  querySelector<T extends Element = Element>(
    selector: string,
    container: ParentNode = document
  ): T | null {
    try {
      return container.querySelector<T>(selector);
    } catch (error) {
      logger.warn(`[DOMService] Invalid selector: ${selector}`, error);
      return null;
    }
  }

  /**
   * 모든 요소 선택
   */
  querySelectorAll<T extends Element = Element>(
    selector: string,
    container: ParentNode = document
  ): T[] {
    try {
      return Array.from(container.querySelectorAll<T>(selector));
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

  // ===== DOM 조작 =====

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

// ===== 기본 Export =====

export { DOMService };
export default domService;
