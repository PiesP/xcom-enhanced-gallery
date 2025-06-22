/**
 * @fileoverview Unified DOM Utilities
 * @version 1.0.0
 *
 * 기존 SafeDOMUtil, ScrollManager 등을 통합한 단일 DOM 유틸리티
 * 모든 DOM 조작은 이 모듈을 통해 수행합니다.
 */

import { logger } from '@infrastructure/logging/logger';

// ========== 타입 정의 ==========

export interface ScrollLockOptions {
  /** 스크롤 위치 복원 여부 */
  restorePosition?: boolean;
  /** 추가 CSS 적용 여부 */
  applyAdditionalStyles?: boolean;
}

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

// ========== 통합 DOM 유틸리티 클래스 ==========

export class UnifiedDOMUtils {
  private static readonly scrollState = {
    isLocked: false,
    originalScrollY: 0,
    originalOverflow: '',
    originalPosition: '',
    originalTop: '',
    originalWidth: '',
  };

  // ========== 요소 선택 및 검증 ==========

  /**
   * 안전한 요소 선택 (기존 SafeDOMUtil.querySelector 통합)
   */
  public static querySelector<T extends Element = Element>(
    selector: string,
    container: ParentNode = document
  ): T | null {
    try {
      if (!selector?.trim()) {
        logger.warn('[UnifiedDOMUtils] Empty selector provided');
        return null;
      }

      return container.querySelector<T>(selector);
    } catch (error) {
      logger.warn(`[UnifiedDOMUtils] Invalid selector: ${selector}`, error);
      return null;
    }
  }

  /**
   * 다중 요소 선택 (기존 SafeDOMUtil.querySelectorAll 통합)
   */
  public static querySelectorAll<T extends Element = Element>(
    selector: string,
    container: ParentNode = document
  ): NodeListOf<T> {
    try {
      if (!selector?.trim()) {
        logger.warn('[UnifiedDOMUtils] Empty selector provided');
        return document.querySelectorAll<T>('never-match');
      }

      return container.querySelectorAll<T>(selector);
    } catch (error) {
      logger.warn(`[UnifiedDOMUtils] Invalid selector: ${selector}`, error);
      return document.querySelectorAll<T>('never-match');
    }
  }

  /**
   * 요소 존재 확인
   */
  public static elementExists(selector: string, container: ParentNode = document): boolean {
    return this.querySelector(selector, container) !== null;
  }

  // ========== 요소 생성 및 조작 ==========

  /**
   * 안전한 요소 생성 (향상된 버전)
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

      // 클래스 설정
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

      return element;
    } catch (error) {
      logger.error(`[UnifiedDOMUtils] Failed to create element: ${tagName}`, error);
      return null;
    }
  }

  /**
   * 안전한 요소 제거
   */
  public static removeElement(element: Element | null): boolean {
    try {
      if (!element?.parentNode) {
        return false;
      }

      element.parentNode.removeChild(element);
      return true;
    } catch (error) {
      logger.error('[UnifiedDOMUtils] Failed to remove element:', error);
      return false;
    }
  }

  // ========== 스크롤 관리 (기존 ScrollManager 통합) ==========

  /**
   * 페이지 스크롤 잠금
   */
  public static lockPageScroll(options: ScrollLockOptions = {}): boolean {
    try {
      if (this.scrollState.isLocked) {
        logger.debug('[UnifiedDOMUtils] Page scroll already locked');
        return true;
      }

      // 현재 상태 저장
      this.scrollState.originalScrollY = window.scrollY || 0;
      this.scrollState.originalOverflow = document.body.style.overflow || '';
      this.scrollState.originalPosition = document.body.style.position || '';
      this.scrollState.originalTop = document.body.style.top || '';
      this.scrollState.originalWidth = document.body.style.width || '';

      // 스크롤 잠금 적용
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${this.scrollState.originalScrollY}px`;
      document.body.style.width = '100%';

      // 추가 스타일 적용 (옵션)
      if (options.applyAdditionalStyles) {
        document.body.style.height = '100vh';
      }

      this.scrollState.isLocked = true;

      logger.debug('[UnifiedDOMUtils] Page scroll locked');
      return true;
    } catch (error) {
      logger.error('[UnifiedDOMUtils] Failed to lock scroll:', error);
      return false;
    }
  }

  /**
   * 페이지 스크롤 잠금 해제
   */
  public static unlockPageScroll(options: ScrollLockOptions = { restorePosition: true }): boolean {
    try {
      if (!this.scrollState.isLocked) {
        logger.debug('[UnifiedDOMUtils] Page scroll not locked');
        return true;
      }

      // 원래 스타일 복원
      document.body.style.overflow = this.scrollState.originalOverflow;
      document.body.style.position = this.scrollState.originalPosition;
      document.body.style.top = this.scrollState.originalTop;
      document.body.style.width = this.scrollState.originalWidth;
      document.body.style.height = '';

      // 스크롤 위치 복원 (옵션)
      if (options.restorePosition !== false) {
        window.scrollTo(0, this.scrollState.originalScrollY);
      }

      this.scrollState.isLocked = false;

      logger.debug('[UnifiedDOMUtils] Page scroll unlocked');
      return true;
    } catch (error) {
      logger.error('[UnifiedDOMUtils] Failed to unlock scroll:', error);
      return false;
    }
  }

  /**
   * 스크롤 잠금 상태 확인
   */
  public static isScrollLocked(): boolean {
    return this.scrollState.isLocked;
  }

  /**
   * 스크롤 위치 가져오기
   */
  public static getScrollPosition(): { x: number; y: number } {
    return {
      x: window.scrollX || 0,
      y: window.scrollY || 0,
    };
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
      if (!element || typeof element.addEventListener !== 'function') {
        logger.warn('[UnifiedDOMUtils] Invalid element for event listener');
        return false;
      }

      element.addEventListener(type, listener, options);
      return true;
    } catch (error) {
      logger.error(`[UnifiedDOMUtils] Failed to add event listener: ${type}`, error);
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
      if (!element || typeof element.removeEventListener !== 'function') {
        logger.warn('[UnifiedDOMUtils] Invalid element for event listener removal');
        return false;
      }

      element.removeEventListener(type, listener, options);
      return true;
    } catch (error) {
      logger.error(`[UnifiedDOMUtils] Failed to remove event listener: ${type}`, error);
      return false;
    }
  }

  // ========== 유틸리티 메서드 ==========

  /**
   * 요소 타입 검증
   */
  public static isElement(obj: unknown): obj is Element {
    return obj instanceof Element;
  }

  /**
   * HTML 요소 타입 검증
   */
  public static isHTMLElement(obj: unknown): obj is HTMLElement {
    return obj instanceof HTMLElement;
  }

  /**
   * 요소의 표시 여부 확인
   */
  public static isElementVisible(element: Element | null): boolean {
    if (!element) return false;

    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }

  /**
   * 요소가 뷰포트에 있는지 확인
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

  /**
   * 디버그 정보 가져오기
   */
  public static getDebugInfo(): Record<string, unknown> {
    return {
      scrollState: { ...this.scrollState },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      scroll: this.getScrollPosition(),
    };
  }
}

// ========== 편의를 위한 named export ==========

export const {
  querySelector,
  querySelectorAll,
  createElement,
  lockPageScroll,
  unlockPageScroll,
  removeElement,
  addEventListener,
  removeEventListener,
  isElement,
  isHTMLElement,
  isElementVisible,
  isElementInViewport,
  isScrollLocked,
  getScrollPosition,
} = UnifiedDOMUtils;

// ========== 기본 export ==========

export default UnifiedDOMUtils;

// ========== 레거시 호환성을 위한 alias ==========

export { UnifiedDOMUtils as DOMUtils };
