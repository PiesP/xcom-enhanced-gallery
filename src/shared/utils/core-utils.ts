/**
 * @fileoverview Core utility integration module
 * @description Integrate core utilities related to DOM, events, and performance into one file
 * @version 2.0.0 - Phase 326.7: Unused function removal
 */

import { isHTMLElement } from './type-guards';

// ================================
// DOM Utilities
// ================================

/**
 * Check if element is inside gallery
 * @param element - Element to check (null-safe)
 * @returns true if element is inside gallery
 * @example
 * ```typescript
 * if (isInsideGallery(target)) {
 *   return; // Ignore events inside gallery
 * }
 * ```
 */
function isInsideGallery(element: Element | null): boolean {
  if (!element) return false;

  return (
    element.closest('[data-gallery-container]') !== null ||
    element.closest('.gallery-container') !== null ||
    element.closest('.xeg-gallery-container') !== null ||
    element.closest('#gallery-view') !== null
  );
}

/**
 * Check if event is internal to gallery
 * Phase 241: Apply event.target type guard
 * @param event - Event to check
 * @returns true if event target is inside gallery
 */
export function isGalleryInternalEvent(event: Event): boolean {
  const target = event.target;
  if (!isHTMLElement(target)) return false;
  return isInsideGallery(target);
}

/**
 * Ensure gallery scroll is available
 */
export function ensureGalleryScrollAvailable(element: HTMLElement | null): void {
  if (!element) {
    return;
  }

  // Find scrollable elements and enable default scroll
  const scrollableElements = element.querySelectorAll(
    '[data-xeg-role="items-list"], .itemsList, .content'
  ) as NodeListOf<HTMLElement>;

  scrollableElements.forEach(el => {
    if (el.style.overflowY !== 'auto' && el.style.overflowY !== 'scroll') {
      el.style.overflowY = 'auto';
    }
  });
}

/**
 * Remove duplicates from string array
 *
 * @param items - String array with possible duplicates
 * @returns String array with duplicates removed
 */
export function removeDuplicateStrings(items: readonly string[]): string[] {
  return [...new Set(items)];
}
