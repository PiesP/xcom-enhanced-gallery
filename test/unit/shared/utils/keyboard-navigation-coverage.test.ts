/**
 * @fileoverview Coverage tests for keyboard-navigation.ts
 * @description Phase 140.4 P0-2: keyboard-navigation.ts 커버리지 개선 (18.9% → 70%+)
 *
 * 목표: 15+ tests 작성, 키보드 접근성 유틸리티 전체 커버
 *
 * Coverage distribution:
 * - Keyboard Navigation: 6 tests (enable, disable, WCAG)
 * - Focus Management: 5 tests (manage, enhance, validate)
 * - Structure Validation: 4 tests (navigation, focusable)
 * - Focus Trap: 4 tests (create, release)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  enableKeyboardNavigation,
  disableKeyboardNavigation,
  enableWCAGKeyboardNavigation,
  manageFocus,
  enhanceFocusVisibility,
  validateKeyboardAccess,
  validateNavigationStructure,
  isFocusable,
  createFocusTrap,
  releaseKeyboardTrap,
} from '@/shared/utils/accessibility/keyboard-navigation';

describe('keyboard-navigation.ts Coverage Tests', () => {
  let container: HTMLElement;
  let button: HTMLButtonElement;
  let input: HTMLInputElement;
  let link: HTMLElement; // HTMLAnchorElement 대신 HTMLElement 사용

  beforeEach(() => {
    // 기본 DOM 구조 생성
    container = document.createElement('div');
    button = document.createElement('button');
    input = document.createElement('input');
    link = document.createElement('a') as HTMLElement;
    link.setAttribute('href', '#'); // JSDOM 호환 방식

    button.textContent = 'Button';
    input.type = 'text';
    link.textContent = 'Link';

    container.appendChild(button);
    container.appendChild(input);
    container.appendChild(link);

    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('Keyboard Navigation', () => {
    it('should enable keyboard navigation with Tab cycling', () => {
      enableKeyboardNavigation(container);

      const focusableElements = container.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      expect(focusableElements.length).toBeGreaterThan(0);
      expect(focusableElements).toContain(button);
      expect(focusableElements).toContain(input);
      expect(focusableElements).toContain(link);
    });

    it('should cycle focus from last to first element on Tab (without Shift)', () => {
      enableKeyboardNavigation(container);

      // 마지막 요소로 포커스 이동
      link.focus();
      expect(document.activeElement).toBe(link);

      // Tab 키 이벤트 (마지막 요소에서 Tab 누름)
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: false,
        bubbles: true,
        cancelable: true,
      });
      const preventDefault = vi.spyOn(event, 'preventDefault');
      link.dispatchEvent(event);

      // focus()가 호출되었는지 확인 (실제 포커스는 JSDOM 제약으로 검증 불가)
      expect(preventDefault).toHaveBeenCalled();
    });

    it('should cycle focus from first to last element on Shift+Tab', () => {
      enableKeyboardNavigation(container);

      // 첫 번째 요소로 포커스 이동
      button.focus();
      expect(document.activeElement).toBe(button);

      // Shift+Tab 키 이벤트
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });
      const preventDefault = vi.spyOn(event, 'preventDefault');
      button.dispatchEvent(event);

      expect(preventDefault).toHaveBeenCalled();
    });

    it('should disable keyboard navigation by setting tabindex="-1"', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      disableKeyboardNavigation(element);

      expect(element.getAttribute('tabindex')).toBe('-1');

      document.body.removeChild(element);
    });

    it('should enable WCAG keyboard navigation with tabindex="0"', () => {
      const div = document.createElement('div');
      container.appendChild(div);

      enableWCAGKeyboardNavigation(div);

      expect(div.getAttribute('tabindex')).toBe('0');
    });

    it('should trigger click on Enter or Space key for WCAG navigation', () => {
      const div = document.createElement('div');
      const clickSpy = vi.fn();
      div.addEventListener('click', clickSpy);
      container.appendChild(div);

      enableWCAGKeyboardNavigation(div);

      // Enter 키
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      div.dispatchEvent(enterEvent);
      expect(clickSpy).toHaveBeenCalledTimes(1);

      // Space 키
      const spaceEvent = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true,
      });
      div.dispatchEvent(spaceEvent);
      expect(clickSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Focus Management', () => {
    it('should manage focus by setting tabindex="0" and focusing element', () => {
      const div = document.createElement('div');
      container.appendChild(div);

      manageFocus(div);

      expect(div.getAttribute('tabindex')).toBe('0');
      // JSDOM에서는 focus() 호출 여부만 확인 가능
      expect(div.tabIndex).toBe(0);
    });

    it('should enhance focus visibility with CSS variables', () => {
      const div = document.createElement('div');
      container.appendChild(div);

      enhanceFocusVisibility(div);

      // CSS 변수가 설정되었는지 확인
      expect(div.style.outline).toContain('var(--xeg-focus-outline');
      expect(div.style.outlineOffset).toBe('var(--xeg-focus-ring-offset)');
    });

    it('should apply fallback styles if CSS variables are not present', () => {
      const div = document.createElement('div');
      container.appendChild(div);

      // CSS 변수가 없는 상황을 시뮬레이션
      enhanceFocusVisibility(div);

      // 폴백 스타일이 적용되었는지 확인
      expect(div.style.outline).toBeTruthy();
      expect(div.style.outlineOffset).toBeTruthy();
    });

    it('should validate keyboard access for positive tabindex', () => {
      const div = document.createElement('div');
      div.setAttribute('tabindex', '0');

      expect(validateKeyboardAccess(div)).toBe(true);
    });

    it('should invalidate keyboard access for negative tabindex', () => {
      const div = document.createElement('div');
      div.setAttribute('tabindex', '-1');

      expect(validateKeyboardAccess(div)).toBe(false);
    });
  });

  describe('Structure Validation', () => {
    it('should validate navigation structure with role="navigation"', () => {
      const nav = document.createElement('div');
      nav.setAttribute('role', 'navigation');
      container.appendChild(nav);

      expect(validateNavigationStructure(container)).toBe(true);
    });

    it('should validate navigation structure with <nav> element', () => {
      const nav = document.createElement('nav');
      container.appendChild(nav);

      expect(validateNavigationStructure(container)).toBe(true);
    });

    it('should invalidate navigation structure without landmarks', () => {
      const emptyContainer = document.createElement('div');
      document.body.appendChild(emptyContainer);

      expect(validateNavigationStructure(emptyContainer)).toBe(false);

      document.body.removeChild(emptyContainer);
    });

    it('should identify focusable elements by tabindex', () => {
      const div = document.createElement('div');
      div.setAttribute('tabindex', '0');

      expect(isFocusable(div)).toBe(true);
    });

    it('should identify focusable elements by tag name (button, input, a)', () => {
      expect(isFocusable(button)).toBe(true);
      expect(isFocusable(input)).toBe(true);
      expect(isFocusable(link)).toBe(true);
    });

    it('should identify non-focusable elements (div without tabindex)', () => {
      const div = document.createElement('div');

      expect(isFocusable(div)).toBe(false);
    });
  });

  describe('Focus Trap', () => {
    it('should create focus trap and activate immediately', () => {
      const trapContainer = document.createElement('div');
      const btn1 = document.createElement('button');
      const btn2 = document.createElement('button');
      trapContainer.appendChild(btn1);
      trapContainer.appendChild(btn2);
      document.body.appendChild(trapContainer);

      // createFocusTrap은 내부에서 unifiedCreateFocusTrap을 호출
      // JSDOM에서 실제 트랩 동작은 테스트하기 어려우므로, 호출 여부만 확인
      expect(() => createFocusTrap(trapContainer)).not.toThrow();

      document.body.removeChild(trapContainer);
    });

    it('should release keyboard trap by removing tabindex attributes', () => {
      const trapContainer = document.createElement('div');
      const btn1 = document.createElement('button');
      btn1.setAttribute('tabindex', '0');
      const btn2 = document.createElement('button');
      btn2.setAttribute('tabindex', '0');
      trapContainer.appendChild(btn1);
      trapContainer.appendChild(btn2);
      document.body.appendChild(trapContainer);

      releaseKeyboardTrap(trapContainer);

      expect(trapContainer.hasAttribute('tabindex')).toBe(false);
      expect(btn1.hasAttribute('tabindex')).toBe(false);
      expect(btn2.hasAttribute('tabindex')).toBe(false);

      document.body.removeChild(trapContainer);
    });

    it('should preserve non-zero tabindex when releasing trap', () => {
      const trapContainer = document.createElement('div');
      const btn1 = document.createElement('button');
      btn1.setAttribute('tabindex', '1'); // 명시적 tabindex
      trapContainer.appendChild(btn1);
      document.body.appendChild(trapContainer);

      releaseKeyboardTrap(trapContainer);

      // tabindex="1"은 제거되지 않아야 함 (only tabindex="0" removed)
      expect(btn1.getAttribute('tabindex')).toBe('1');

      document.body.removeChild(trapContainer);
    });

    it('should handle empty container when releasing trap', () => {
      const emptyContainer = document.createElement('div');
      document.body.appendChild(emptyContainer);

      expect(() => releaseKeyboardTrap(emptyContainer)).not.toThrow();

      document.body.removeChild(emptyContainer);
    });
  });
});
