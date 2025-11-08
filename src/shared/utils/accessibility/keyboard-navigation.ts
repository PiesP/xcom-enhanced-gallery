/**
 * @fileoverview Keyboard Navigation Utilities
 * @description WCAG keyboard accessibility and focus management functions
 */

import { createFocusTrap as unifiedCreateFocusTrap } from '../focus-trap';

/**
 * Enable keyboard navigation
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
        lastElement.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus({ preventScroll: true });
      }
    }
  });
}

/**
 * Disable keyboard navigation
 */
export function disableKeyboardNavigation(element: HTMLElement): void {
  element.setAttribute('tabindex', '-1');
}

/**
 * Enable WCAG keyboard navigation
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
 * Manage focus
 * WCAG 2.4.3 Focus Order
 * @note Uses preventScroll: true to prevent SPA timeline interference
 * @see Phase 415: SPA Scroll Recovery
 */
export function manageFocus(element: HTMLElement): void {
  element.setAttribute('tabindex', '0');
  element.focus({ preventScroll: true });
}

/**
 * Enhance focus visibility
 * WCAG 2.4.7 Focus Visible Enhancement
 */
export function enhanceFocusVisibility(element: HTMLElement): void {
  // CSS variables for dynamic style application
  element.style.outline = 'var(--xeg-focus-outline)';
  element.style.outlineOffset = 'var(--xeg-focus-ring-offset)';

  // Fallback for when CSS variables are not available
  if (!element.style.outline.includes('var(')) {
    element.style.outline =
      'var(--xeg-focus-outline-width) var(--xeg-focus-outline-style) var(--xeg-focus-outline-color)';
    element.style.outlineOffset = 'var(--xeg-focus-ring-offset)';
  }
}

/**
 * Validate keyboard accessibility
 * WCAG 2.1.1 Keyboard
 */
export function validateKeyboardAccess(element: HTMLElement): boolean {
  return element.tabIndex >= 0 || element.getAttribute('tabindex') === '0';
}

/**
 * Validate navigation structure
 * WCAG 2.4.1 Navigation Structure
 */
export function validateNavigationStructure(container: HTMLElement): boolean {
  const landmarks = container.querySelectorAll('[role="navigation"], nav');
  return landmarks.length > 0;
}

/**
 * Check if element is focusable
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
 * Set focus trap
 * WCAG 2.4.3 Focus Order
 */
export function createFocusTrap(container: HTMLElement): void {
  // Delegate to unified utility to use standardized behavior
  const trap = unifiedCreateFocusTrap(container, { restoreFocus: false });
  // Maintain existing accessibility utility signature while immediately activate
  trap.activate();
}

/**
 * Release keyboard trap
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
