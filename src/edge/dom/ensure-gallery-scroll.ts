/**
 * @fileoverview Gallery scroll utilities (Edge)
 * @description DOM mutation helpers that must run in the browser/Edge layer
 */

/**
 * Ensure gallery scroll is available by enforcing scrollable containers to allow overflow.
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
