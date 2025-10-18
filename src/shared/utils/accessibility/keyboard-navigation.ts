/**
 * @fileoverview Keyboard Navigation Utilities
 * @description WCAG 키보드 접근성 및 포커스 관리 함수들
 */

import { createFocusTrap as unifiedCreateFocusTrap } from '../focus-trap';

/**
 * 키보드 네비게이션 활성화
 * WCAG 2.1.1 Keyboard
 */
export function enableKeyboardNavigation(container: HTMLElement): void {
  container.addEventListener('keydown', event => {
    if (event.key === 'Tab') {
      const focusableElements = container.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  });
}

/**
 * 키보드 네비게이션 비활성화
 */
export function disableKeyboardNavigation(element: HTMLElement): void {
  element.setAttribute('tabindex', '-1');
}

/**
 * WCAG 키보드 네비게이션 활성화
 * WCAG 2.1.1 Keyboard
 */
export function enableWCAGKeyboardNavigation(element: HTMLElement): void {
  if (!element.hasAttribute('tabindex')) {
    element.setAttribute('tabindex', '0');
  }

  element.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      element.click();
    }
  });
}

/**
 * 포커스 관리
 * WCAG 2.4.3 Focus Order
 */
export function manageFocus(element: HTMLElement): void {
  element.setAttribute('tabindex', '0');
  element.focus();
}

/**
 * 포커스 표시 강화
 * WCAG 2.4.7 Focus Visible Enhancement
 */
export function enhanceFocusVisibility(element: HTMLElement): void {
  // CSS 변수를 통한 동적 스타일 적용
  element.style.outline = 'var(--xeg-focus-outline)';
  element.style.outlineOffset = 'var(--xeg-focus-ring-offset)';

  // CSS 변수가 없는 경우를 위한 폴백
  if (!element.style.outline.includes('var(')) {
    element.style.outline =
      'var(--xeg-focus-outline-width) var(--xeg-focus-outline-style) var(--xeg-focus-outline-color)';
    element.style.outlineOffset = 'var(--xeg-focus-ring-offset)';
  }
}

/**
 * 키보드 접근성 검증
 * WCAG 2.1.1 Keyboard
 */
export function validateKeyboardAccess(element: HTMLElement): boolean {
  return element.tabIndex >= 0 || element.getAttribute('tabindex') === '0';
}

/**
 * 네비게이션 구조 검증
 * WCAG 2.4.1 Navigation Structure
 */
export function validateNavigationStructure(container: HTMLElement): boolean {
  const landmarks = container.querySelectorAll('[role="navigation"], nav');
  return landmarks.length > 0;
}

/**
 * 포커스 가능 여부 확인
 */
export function isFocusable(element: HTMLElement): boolean {
  const tabindex = element.getAttribute('tabindex');
  if (tabindex !== null) {
    return parseInt(tabindex) >= 0;
  }

  const focusableElements = ['input', 'button', 'select', 'textarea', 'a'];
  return focusableElements.includes(element.tagName.toLowerCase());
}

/**
 * 포커스 트랩 설정
 * WCAG 2.4.3 Focus Order
 */
export function createFocusTrap(container: HTMLElement): void {
  // 통합 유틸로 위임하여 표준화된 동작을 사용한다
  const trap = unifiedCreateFocusTrap(container, { restoreFocus: false });
  // 접근성 유틸의 기존 시그니처를 유지하면서 즉시 활성화
  trap.activate();
}

/**
 * 키보드 트랩 해제
 * WCAG 2.1.2 No Keyboard Trap
 */
export function releaseKeyboardTrap(container: HTMLElement): void {
  container.removeAttribute('tabindex');
  const focusableElements = container.querySelectorAll('[tabindex]');
  focusableElements.forEach(el => {
    if (el.getAttribute('tabindex') === '0') {
      el.removeAttribute('tabindex');
    }
  });
}
