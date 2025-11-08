/**
 * @fileoverview Scroll Utilities
 * @description Scroll event and gallery element inspection utilities
 */

import { logger } from '@shared/logging';
import { Debouncer } from '../performance/performance-utils';

/**
 * Check if element is gallery element
 * @param element - HTML element to inspect (null-safe)
 * @returns true if element is a gallery element
 * @example
 * ```typescript
 * if (isGalleryElement(target)) {
 *   // gallery-specific handling
 * }
 * ```
 */
export function isGalleryElement(element: HTMLElement | null): boolean {
  if (!element) return false;

  const gallerySelectors = [
    '.xeg-gallery-container',
    '[data-gallery-element]',
    '#xeg-gallery-root',
    '.vertical-gallery-view',
    '[data-xeg-gallery-container]',
    '[data-xeg-gallery]',
    '.xeg-vertical-gallery',
    '.xeg-gallery',
    '.gallery-container',
    '[data-gallery]',
  ];

  return gallerySelectors.some(selector => {
    try {
      return element.matches(selector) || element.closest(selector) !== null;
    } catch {
      return false;
    }
  });
}

/**
 * Create scroll debouncer
 * @param callback - Function to call after scroll ends
 * @param delay - Wait time (default: 150ms)
 * @returns Debouncer instance
 * @example
 * ```typescript
 * const debouncer = createScrollDebouncer(() => {
 *   console.log('Scrolling stopped');
 * }, 200);
 * ```
 */
export function createScrollDebouncer(callback: () => void, delay: number = 150): Debouncer<[]> {
  return new Debouncer(callback, delay);
}

// Re-export throttleScroll from performance utils (RAF-based, more efficient)
export { throttleScroll } from '../performance/performance-utils';

/**
 * Create scroll event handler
 * @param element - HTML element to register event listener on
 * @param callback - Function to call when scroll is detected (deltaY and event are passed)
 * @param options - Handler options (threshold, captureOnDocument)
 * @returns Function to remove listener
 * @example
 * ```typescript
 * const remove = createScrollHandler(element, (deltaY) => {
 *   console.log(`Scrolled: ${deltaY}px`);
 * }, { threshold: 10 });
 *
 * // Remove listener later
 * remove();
 * ```
 */
export function createScrollHandler(
  element: HTMLElement,
  callback: (deltaY: number, event: WheelEvent) => void,
  options: {
    threshold?: number;
    captureOnDocument?: boolean;
  } = {}
): () => void {
  const { threshold = 0, captureOnDocument = false } = options;

  const wheelHandler = (event: Event) => {
    const wheelEvent = event as WheelEvent;
    if (Math.abs(wheelEvent.deltaY) > threshold) {
      try {
        callback(wheelEvent.deltaY, wheelEvent);
      } catch (error) {
        logger.error('Scroll handler execution failed', error);
      }
    }
  };

  const targetElement = captureOnDocument ? document : element;

  try {
    targetElement.addEventListener('wheel', wheelHandler, { passive: true });
    logger.debug('Wheel event listener registered', {
      target: captureOnDocument ? 'document' : 'element',
      threshold,
    });

    return () => {
      try {
        targetElement.removeEventListener('wheel', wheelHandler);
        logger.debug('Wheel event listener removed');
      } catch (error) {
        logger.error('Failed to remove wheel event listener', error);
      }
    };
  } catch (error) {
    logger.error('Event listener registration failed', error);
    return () => {}; // noop cleanup function
  }
}
