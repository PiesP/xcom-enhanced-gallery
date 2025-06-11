import { logger } from '@infrastructure/logging/logger';

/**
 * Safe DOM manipulation utilities
 *
 * 모든 DOM 조작을 안전하게 수행하는 유틸리티 모음입니다.
 * 각 함수는 예외를 처리하고 실패 시 안전한 기본값을 반환합니다.
 */
export const SafeDOMUtil = {
  /**
   * 안전하게 CSS 셀렉터로 단일 요소를 검색합니다
   *
   * @param selector - CSS 셀렉터 문자열
   * @param root - 검색을 시작할 루트 요소 (기본값: document)
   * @returns 찾은 요소 또는 없을 시 null
   */
  querySelector: <T extends Element = Element>(
    selector: string,
    root: Document | Element = document
  ): T | null => {
    try {
      if (!selector || !root?.querySelector) {
        return null;
      }
      return root.querySelector(selector) as T | null;
    } catch (error) {
      logger.error('Failed to query selector:', selector, error);
      return null;
    }
  },

  /**
   * 안전하게 CSS 셀렉터로 모든 일치하는 요소들을 검색합니다
   *
   * @param selector - CSS 셀렉터 문자열
   * @param root - 검색을 시작할 루트 요소 (기본값: document)
   * @returns 찾은 요소들의 NodeList 또는 오류 시 빈 배열
   */
  querySelectorAll: <T extends Element = Element>(
    selector: string,
    root: Document | Element = document
  ): NodeListOf<T> => {
    try {
      if (!selector || !root?.querySelectorAll) {
        return [] as unknown as NodeListOf<T>;
      }
      return root.querySelectorAll(selector) as NodeListOf<T>;
    } catch (error) {
      logger.error('Failed to query selector all:', selector, error);
      return [] as unknown as NodeListOf<T>;
    }
  },

  /**
   * 안전하게 ID로 요소를 찾습니다
   *
   * @param id - 찾을 요소의 ID
   * @returns 찾은 요소 또는 없을 시 null
   */
  getElementById: (id: string): HTMLElement | null => {
    try {
      if (!id || !document?.getElementById) {
        return null;
      }
      return document.getElementById(id);
    } catch (error) {
      logger.error('Failed to get element by id:', id, error);
      return null;
    }
  },

  /**
   * 안전하게 HTML 요소를 생성합니다
   *
   * @param tag - 생성할 HTML 태그 이름
   * @param attributes - 설정할 속성들 (선택사항)
   * @returns 생성된 HTML 요소 또는 실패 시 null
   */
  createElement: <K extends keyof HTMLElementTagNameMap>(
    tag: K,
    attributes?: Record<string, string>
  ): HTMLElementTagNameMap[K] | null => {
    try {
      if (!tag || !document?.createElement) {
        return null;
      }
      const element = document.createElement(tag);

      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          try {
            if (key === 'className') {
              element.className = value;
            } else {
              element.setAttribute(key, value);
            }
          } catch (error) {
            logger.error('Failed to set attribute:', key, value, error);
          }
        });
      }

      return element;
    } catch (error) {
      logger.error('Failed to create element:', tag, error);
      return null;
    }
  },

  /**
   * 안전하게 요소의 속성을 설정합니다
   *
   * @param element - 대상 요소
   * @param name - 속성명
   * @param value - 속성값
   * @returns 성공 시 true, 실패 시 false
   */
  setAttribute: (element: Element | null, name: string, value: string): boolean => {
    try {
      if (!element || !name || !element.setAttribute) {
        return false;
      }
      element.setAttribute(name, value);
      return true;
    } catch (error) {
      logger.error('Failed to set attribute:', name, value, error);
      return false;
    }
  },

  /**
   * 안전하게 요소의 속성을 가져옵니다
   *
   * @param element - 대상 요소
   * @param name - 속성명
   * @returns 속성값 또는 없을 시 null
   */
  getAttribute: (element: Element | null, name: string): string | null => {
    try {
      if (!element || !name || !element.getAttribute) {
        return null;
      }
      return element.getAttribute(name);
    } catch (error) {
      logger.error('Failed to get attribute:', name, error);
      return null;
    }
  },

  /**
   * 안전하게 이벤트 리스너를 추가합니다
   *
   * @param element - 대상 요소
   * @param type - 이벤트 타입
   * @param listener - 이벤트 리스너
   * @param options - 이벤트 옵션 (선택사항)
   * @returns 성공 시 true, 실패 시 false
   */
  addEventListener: (
    element: Element | null,
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions
  ): boolean => {
    try {
      if (!element || !type || !listener || !element.addEventListener) {
        return false;
      }
      element.addEventListener(type, listener, options);
      return true;
    } catch (error) {
      logger.error('Failed to add event listener:', type, error);
      return false;
    }
  },

  /**
   * 안전하게 이벤트 리스너를 제거합니다
   *
   * @param element - 대상 요소
   * @param type - 이벤트 타입
   * @param listener - 이벤트 리스너
   * @param options - 이벤트 옵션 (선택사항)
   * @returns 성공 시 true, 실패 시 false
   */
  removeEventListener: (
    element: Element | null,
    type: string,
    listener: EventListener,
    options?: EventListenerOptions
  ): boolean => {
    try {
      if (!element || !type || !listener || !element.removeEventListener) {
        return false;
      }
      element.removeEventListener(type, listener, options);
      return true;
    } catch (error) {
      logger.error('Failed to remove event listener:', type, error);
      return false;
    }
  },

  /**
   * 안전하게 자식 요소를 부모 요소에 추가합니다
   *
   * @param parent - 부모 요소
   * @param child - 추가할 자식 요소
   * @returns 성공 시 true, 실패 시 false
   */
  appendChild: (parent: Element | null, child: Element | null): boolean => {
    try {
      if (!parent || !child || !parent.appendChild) {
        return false;
      }
      parent.appendChild(child);
      return true;
    } catch (error) {
      logger.error('Failed to append child:', error);
      return false;
    }
  },

  /**
   * 안전하게 부모 요소에서 자식 요소를 제거합니다
   *
   * @param parent - 부모 요소
   * @param child - 제거할 자식 요소
   * @returns 성공 시 true, 실패 시 false
   */
  removeChild: (parent: Element | null, child: Element | null): boolean => {
    try {
      if (!parent || !child || !parent.removeChild || child.parentNode !== parent) {
        return false;
      }
      parent.removeChild(child);
      return true;
    } catch (error) {
      logger.error('Failed to remove child:', error);
      return false;
    }
  },

  /**
   * 요소가 Element 인스턴스인지 확인합니다
   *
   * @param value - 확인할 값
   * @returns Element 인스턴스이면 true, 아니면 false
   */
  isElement: (value: unknown): value is Element => {
    try {
      if (value == null) {
        return false;
      }

      // DOM 환경에서 Element 인스턴스 확인
      if (typeof Element !== 'undefined' && value instanceof Element) {
        return true;
      }

      // Node 환경이나 모킹 환경에서 Element-like 객체 확인
      if (typeof value === 'object' && value !== null) {
        const obj = value as Record<string, unknown>;
        return (
          typeof obj.tagName === 'string' && typeof obj.nodeType === 'number' && obj.nodeType === 1 // ELEMENT_NODE
        );
      }

      return false;
    } catch (error) {
      logger.error('Failed to check if element:', error);
      return false;
    }
  },
};

// 기존 safeDom은 SafeDOMUtil의 별칭으로 유지 (하위 호환성)
export const safeDom = SafeDOMUtil;
