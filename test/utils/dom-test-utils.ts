/**
 * @fileoverview DOM Test Utilities
 * @description DOM 조작 및 이벤트 시뮬레이션을 위한 테스트 유틸리티
 */

import { vi } from 'vitest';

/**
 * DOM 이벤트 시뮬레이션
 */
export function simulateEvent(element: Element, eventType: string, options = {}) {
  const event = new Event(eventType, {
    bubbles: true,
    cancelable: true,
    ...options,
  });

  element.dispatchEvent(event);
  return event;
}

/**
 * 마우스 클릭 시뮬레이션
 */
export function simulateClick(element: Element, options = {}) {
  return simulateEvent(element, 'click', options);
}

/**
 * 키보드 이벤트 시뮬레이션
 */
export function simulateKeyPress(element: Element, key: string, options = {}) {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  });

  element.dispatchEvent(event);
  return event;
}

/**
 * DOM 쿼리 헬퍼
 */
export function queryByTestId(testId: string): Element | null {
  return document.querySelector(`[data-testid="${testId}"]`);
}

/**
 * 모든 테스트 ID로 쿼리
 */
export function queryAllByTestId(testId: string): Element[] {
  return Array.from(document.querySelectorAll(`[data-testid="${testId}"]`));
}

/**
 * DOM 구조 검증 헬퍼
 */
export function expectElementToExist(selector: string): Element {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Element with selector "${selector}" not found`);
  }
  return element;
}

/**
 * 요소 가시성 검증
 */
export function expectElementToBeVisible(element: Element): void {
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') {
    throw new Error('Element is not visible');
  }
}

/**
 * 클래스 존재 검증
 */
export function expectElementToHaveClass(element: Element, className: string): void {
  if (!element.classList.contains(className)) {
    throw new Error(`Element does not have class "${className}"`);
  }
}
