/**
 * 간단한 DOM 유틸리티
 *
 * 중복된 DOM 조작 함수들을 통합하여
 * 일관된 DOM 유틸리티 인터페이스를 제공합니다.
 */

import { createScopedLogger } from '@shared/logging/logger';

const logger = createScopedLogger('SimpleDOMUtils');

// 간단한 쿼리 캐시
const queryCache = new Map<string, Element | null>();

/**
 * 안전한 쿼리 선택자 - null 체크 포함
 */
export function safeQuerySelector<T extends Element = Element>(
  selector: string,
  context: Document | Element = document
): T | null {
  try {
    return context.querySelector<T>(selector);
  } catch (error) {
    logger.warn(`Invalid selector: ${selector}`, error);
    return null;
  }
}

/**
 * 캐시된 쿼리 선택자
 */
export function querySelector<T extends Element = Element>(
  selector: string,
  useCache = true
): T | null {
  if (useCache && queryCache.has(selector)) {
    return queryCache.get(selector) as T | null;
  }

  const element = safeQuerySelector<T>(selector);

  if (useCache) {
    queryCache.set(selector, element);
  }

  return element;
}

/**
 * 안전한 쿼리 선택자 (모든 요소) - null 체크 포함
 */
export function safeQuerySelectorAll<T extends Element = Element>(
  selector: string,
  context: Document | Element = document
): NodeListOf<T> | null {
  try {
    return context.querySelectorAll<T>(selector);
  } catch (error) {
    logger.warn(`Invalid selector: ${selector}`, error);
    return null;
  }
}

/**
 * 모든 쿼리 선택자 (배열로 반환)
 */
export function querySelectorAll<T extends Element = Element>(
  selector: string,
  context: Document | Element = document
): T[] {
  const elements = safeQuerySelectorAll<T>(selector, context);
  return elements ? Array.from(elements) : [];
}

/**
 * 요소 존재 여부 확인
 */
export function elementExists(selector: string, context: Document | Element = document): boolean {
  return safeQuerySelector(selector, context) !== null;
}

/**
 * 요소가 보이는지 확인
 */
export function isElementVisible(element: Element): boolean {
  if (!element) return false;

  const style = getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    element.getBoundingClientRect().width > 0 &&
    element.getBoundingClientRect().height > 0
  );
}

/**
 * 요소 생성
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  options?: {
    className?: string;
    id?: string;
    attributes?: Record<string, string>;
    styles?: Record<string, string>;
    textContent?: string;
  }
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);

  if (options) {
    if (options.className) element.className = options.className;
    if (options.id) element.id = options.id;
    if (options.textContent) element.textContent = options.textContent;

    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }

    if (options.styles) {
      Object.entries(options.styles).forEach(([key, value]) => {
        (element as HTMLElement).style.setProperty(key, value);
      });
    }
  }

  return element;
}

/**
 * 요소에 클래스 안전하게 추가
 */
export function safeAddClass(element: Element | null, className: string): boolean {
  if (!element || !className) return false;

  try {
    element.classList.add(className);
    return true;
  } catch (error) {
    logger.warn(`Failed to add class ${className}:`, error);
    return false;
  }
}

/**
 * 요소에서 클래스 안전하게 제거
 */
export function safeRemoveClass(element: Element | null, className: string): boolean {
  if (!element || !className) return false;

  try {
    element.classList.remove(className);
    return true;
  } catch (error) {
    logger.warn(`Failed to remove class ${className}:`, error);
    return false;
  }
}

/**
 * 안전한 스타일 설정
 */
export function safeSetStyle(element: Element | null, property: string, value: string): boolean {
  if (!element || !property) return false;

  try {
    (element as HTMLElement).style.setProperty(property, value);
    return true;
  } catch (error) {
    logger.warn(`Failed to set style ${property}: ${value}:`, error);
    return false;
  }
}

/**
 * 안전한 속성 설정
 */
export function safeSetAttribute(element: Element | null, name: string, value: string): boolean {
  if (!element || !name) return false;

  try {
    element.setAttribute(name, value);
    return true;
  } catch (error) {
    logger.warn(`Failed to set attribute ${name}: ${value}:`, error);
    return false;
  }
}

/**
 * 안전한 요소 제거
 */
export function safeRemoveElement(element: Element | null): boolean {
  if (!element) return false;

  try {
    element.remove();
    return true;
  } catch (error) {
    logger.warn('Failed to remove element:', error);
    return false;
  }
}

/**
 * 요소 제거 (별칭)
 */
export function removeElement(element: Element | null): void {
  safeRemoveElement(element);
}

/**
 * 배치 업데이트 (DOM 변경사항을 한 번에 처리)
 */
export function batchUpdate(operations: Array<() => void>): void {
  // requestAnimationFrame을 사용하여 DOM 업데이트를 배치 처리
  requestAnimationFrame(() => {
    operations.forEach(operation => {
      try {
        operation();
      } catch (error) {
        logger.warn('Batch operation failed:', error);
      }
    });
  });
}

/**
 * 쿼리 캐시 정리
 */
export function clearCache(): void {
  queryCache.clear();
  logger.debug('Query cache cleared');
}
