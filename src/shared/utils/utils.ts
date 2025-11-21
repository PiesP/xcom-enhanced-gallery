/**
 * @fileoverview Collection of utilities
 * @description Simplified utilities collection suitable for userscripts
 * @version 2.0.0 - Complexity Reduction & Modularization
 */

import { logger } from '@shared/logging';
import { gallerySignals } from '@shared/state/signals/gallery.signals';
import { CSS as CSS_CONST, VIDEO_CONTROL_SELECTORS } from '@/constants';
import { isHTMLElement } from './type-guards';

// ================================
// Re-exports from focused modules
// ================================

/**
 * Ensure gallery scroll is available by enforcing scrollable containers to allow overflow.
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

// Deduplication utilities
export { removeDuplicateMediaItems } from './deduplication/deduplication-utils';

// Debug utilities (removed in Phase 140.2 - unused code cleanup)

// ================================
// Gallery utilities (simplified functions)
// ================================

// Gallery element selectors (constants)
const GALLERY_SELECTORS = CSS_CONST.INTERNAL_SELECTORS;
const GALLERY_CONTAINER_QUERY = [
  CSS_CONST.SELECTORS.CONTAINER,
  CSS_CONST.SELECTORS.DATA_CONTAINER,
  CSS_CONST.SELECTORS.ROOT,
  CSS_CONST.SELECTORS.DATA_GALLERY,
].join(', ');

/**
 * Check if gallery can be triggered
 */
export function canTriggerGallery(target: HTMLElement | null): boolean {
  if (!target) return false;

  // Phase 21.6: Migrated to use gallerySignals
  // Don't trigger if gallery is already open
  if (gallerySignals.isOpen.value) {
    return false;
  }

  // Check if it's a video control element
  if (isVideoControlElement(target)) {
    return false;
  }

  // Check if it's an internal gallery element
  if (isGalleryInternalElement(target)) {
    return false;
  }

  return true;
}

/**
 * Check if element is inside gallery
 * Phase 237: Strengthen element.matches type guard
 */
export function isGalleryInternalElement(element: HTMLElement | null): boolean {
  if (!element) return false;

  // Phase 242: Guard against non-HTMLElement nodes (e.g., Document during capture phase)
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  // Phase 237: Check existence of matches method (strengthen type guard)
  if (typeof element.matches !== 'function') {
    logger.warn('Invalid element: matches is not a function', element);
    return false;
  }

  return GALLERY_SELECTORS.some(selector => {
    try {
      return element.matches(selector) || element.closest(selector) !== null;
    } catch (error) {
      logger.warn('Invalid selector:', selector, error);
      return false;
    }
  });
}

/**
 * Check if element is gallery container
 */
export function isGalleryContainer(element: HTMLElement | null): boolean {
  if (!element) return false;

  try {
    return element.matches(GALLERY_CONTAINER_QUERY);
  } catch {
    return false;
  }
}

/**
 * Check if element is a video control element
 */
export function isVideoControlElement(element: HTMLElement | null): boolean {
  if (!element) return false;

  // Check basic elements
  const tagName = element.tagName.toLowerCase();
  if (tagName === 'video') return true;

  // Check selector matching
  return VIDEO_CONTROL_SELECTORS.some(selector => {
    try {
      return element.matches(selector) || element.closest(selector) !== null;
    } catch {
      return false;
    }
  });
}

/**
 * Check if event is internal to gallery
 * Phase 241: Apply event.target type guard
 */
export function isGalleryInternalEvent(event: Event): boolean {
  const target = event.target;
  if (!isHTMLElement(target)) return false;
  return isGalleryInternalElement(target);
}
