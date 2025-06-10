import { logger } from '@infrastructure/logging/logger';

/**
 * Safe DOM manipulation utilities
 *
 * 모든 DOM 조작을 안전하게 수행하는 유틸리티 모음입니다.
 * 각 함수는 예외를 처리하고 실패 시 안전한 기본값을 반환합니다.
 */
export const safeDom = {
  /**
   * 안전하게 HTML 요소를 생성합니다
   *
   * @param tag - 생성할 HTML 태그 이름
   * @returns 생성된 HTML 요소 또는 실패 시 null
   *
   * @example
   * ```typescript
   * const div = safeDom.createElement('div');
   * if (div) {
   *   div.className = 'my-class';
   * }
   * ```
   */
  createElement: <K extends keyof HTMLElementTagNameMap>(
    tag: K
  ): HTMLElementTagNameMap[K] | null => {
    try {
      return document.createElement(tag);
    } catch (error) {
      logger.error('Failed to create element:', tag, error);
      return null;
    }
  },

  /**
   * 안전하게 자식 요소를 부모 요소에 추가합니다
   *
   * @param parent - 부모 요소
   * @param child - 추가할 자식 요소
   * @returns 성공 시 true, 실패 시 false
   *
   * @example
   * ```typescript
   * const success = safeDom.appendChild(container, newElement);
   * if (!success) {
   *   console.warn('Failed to append element');
   * }
   * ```
   */
  appendChild: (parent: Element, child: Element): boolean => {
    try {
      if (parent && child && parent.appendChild) {
        parent.appendChild(child);
        return true;
      }
      return false;
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
   *
   * @example
   * ```typescript
   * const success = safeDom.removeChild(container, oldElement);
   * if (!success) {
   *   console.warn('Failed to remove element');
   * }
   * ```
   */
  removeChild: (parent: Element, child: Element): boolean => {
    try {
      if (parent && child && parent.removeChild && child.parentNode === parent) {
        parent.removeChild(child);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Failed to remove child:', error);
      return false;
    }
  },

  /**
   * 안전하게 CSS 셀렉터로 단일 요소를 검색합니다
   *
   * @param selector - CSS 셀렉터 문자열
   * @param root - 검색을 시작할 루트 요소 (기본값: document)
   * @returns 찾은 요소 또는 없을 시 null
   *
   * @example
   * ```typescript
   * const button = safeDom.querySelector<HTMLButtonElement>('.my-button');
   * if (button) {
   *   button.click();
   * }
   * ```
   */
  querySelector: <K extends keyof HTMLElementTagNameMap>(
    selector: string,
    root: Document | Element = document
  ): HTMLElementTagNameMap[K] | null => {
    try {
      return root.querySelector(selector);
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
   * @returns 찾은 요소들의 NodeList 또는 오류 시 null
   *
   * @example
   * ```typescript
   * const buttons = safeDom.querySelectorAll<HTMLButtonElement>('.my-button');
   * if (buttons) {
   *   buttons.forEach(btn => btn.disabled = true);
   * }
   * ```
   */
  querySelectorAll: <K extends keyof HTMLElementTagNameMap>(
    selector: string,
    root: Document | Element = document
  ): NodeListOf<HTMLElementTagNameMap[K]> | null => {
    try {
      return root.querySelectorAll(selector);
    } catch (error) {
      logger.error('Failed to query selector all:', selector, error);
      return null;
    }
  },
};
