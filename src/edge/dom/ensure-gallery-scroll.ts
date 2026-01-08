/**
 * @fileoverview Gallery scroll availability enforcement for Edge layer.
 * Ensures scrollable containers have proper overflow enabled via inline styles.
 * @module edge/dom/ensure-gallery-scroll
 */

/**
 * Ensure gallery and content containers have scrollable overflow enabled.
 * Sets overflowY to 'auto' on matched scrollable container selectors.
 * @param element - Root element to search for scrollable containers, or null to skip.
 */
export function ensureGalleryScrollAvailable(element: HTMLElement | null): void {
  if (!element) {
    return;
  }

  // Find scrollable elements and enable default scroll.
  const scrollableElements = element.querySelectorAll(
    '[data-xeg-role="items-list"], .itemsList, .content'
  ) as NodeListOf<HTMLElement>;

  scrollableElements.forEach((el) => {
    if (el.style.overflowY !== 'auto' && el.style.overflowY !== 'scroll') {
      el.style.overflowY = 'auto';
    }
  });
}
