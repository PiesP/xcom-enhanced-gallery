/**
 * @fileoverview DOM Predicate Utilities - consolidated helpers for matches/closest
 * @description 안전한 selector 처리와 일관된 로깅을 제공하는 공용 프리디케이트 유틸
 */
import { logger } from '@shared/logging';

export function isMatching(element: Element | null, selector: string): boolean {
  if (!element) return false;
  try {
    return element.matches(selector);
  } catch (error) {
    logger.warn('Invalid selector for matches:', selector, error);
    return false;
  }
}

export function hasClosest(element: Element | null, selector: string): boolean {
  if (!element) return false;
  try {
    return !!element.closest(selector);
  } catch (error) {
    logger.warn('Invalid selector for closest:', selector, error);
    return false;
  }
}

export function findClosest<T extends Element = HTMLElement>(
  element: Element | null,
  selector: string
): T | null {
  if (!element) return null;
  try {
    return (element.closest(selector) as T) ?? null;
  } catch (error) {
    logger.warn('Invalid selector for findClosest:', selector, error);
    return null;
  }
}

export function anyMatchOrClosest(element: Element | null, selectors: readonly string[]): boolean {
  for (const selector of selectors) {
    if (isMatching(element, selector) || hasClosest(element, selector)) return true;
  }
  return false;
}

export function anyClosest(element: Element | null, selectors: readonly string[]): boolean {
  for (const selector of selectors) {
    if (hasClosest(element, selector)) return true;
  }
  return false;
}
