/**
 * @fileoverview Gallery scroll availability enforcement for Edge layer
 *
 * Provides DOM utilities that ensure gallery and content containers have scrollable
 * overflow enabled. These utilities must run in the Edge layer (browser context)
 * to manipulate inline styles on actual DOM elements, enabling proper scroll behavior
 * for gallery items and other scrollable containers.
 *
 * @remarks
 * **Purpose**:
 * - Ensure scrollable containers allow vertical overflow (overflowY: auto/scroll)
 * - Prevent layout from hiding scroll content with overflow:hidden
 * - Enforce scroll availability even when parent styles conflict
 *
 * **Architecture Context**:
 * - **Layer**: Edge DOM utilities (runs in browser/userscript context)
 * - **Scope**: Operates on actual DOM elements via querySelector
 * - **Timing**: Should run after DOM mutation/element creation
 * - **Side Effects**: Modifies inline styles (overflowY property)
 *
 * **Design Principles**:
 * 1. **Defensive Queries**: Multi-selector approach for different DOM structures
 * 2. **Conditional Modification**: Only modify if not already scrollable
 * 3. **Null Safety**: Handles null/missing elements gracefully
 * 4. **Minimal Intervention**: Only sets overflowY, doesn't remove other styles
 * 5. **Browser Context**: Direct DOM manipulation via querySelectorAll
 *
 * **Selector Strategy**:
 * - `[data-xeg-role="items-list"]`: XEG custom gallery container attribute
 * - `.itemsList`: Twitter-style gallery items container class
 * - `.content`: Generic content scrollable container fallback
 *
 * **Usage Pattern**:
 * Call ensureGalleryScrollAvailable() after inserting gallery elements or
 * when detecting that scroll is disabled. Function is safe to call repeatedly.
 *
 * **Related DOM Elements**:
 * - Gallery items lists (photo/video galleries)
 * - Content containers (feed, timeline)
 * - Modal/dialog scrollable areas
 *
 * @module edge/dom/ensure-gallery-scroll
 * @see {@link Element.scrollHeight} for overflow detection
 * @see {@link CSSStyleDeclaration.overflowY} for style manipulation
 */

/**
 * Ensure gallery and content containers have scrollable overflow enabled
 *
 * Searches for scrollable container elements and enforces overflowY: auto
 * to allow vertical scrolling. Handles cases where parent styles or DOM
 * structure prevent default scroll behavior.
 *
 * @param element - Root element to search for scrollable containers,
 *   or null to skip processing
 * @returns void (modifies elements in-place via side effects)
 *
 * @remarks
 * **Behavior**:
 * - Queries for known scrollable container selectors within element
 * - For each found container, checks if overflowY is already auto/scroll
 * - If not scrollable, sets overflowY to 'auto' to enable scrolling
 * - Does not modify other style properties
 * - Safely handles null/undefined element parameter
 *
 * **Selectors Used**:
 * - `[data-xeg-role="items-list"]`: Custom XEG gallery attribute
 * - `.itemsList`: Twitter items list class
 * - `.content`: Generic content container class
 *
 * **Null Safety**:
 * - Returns early if element is null or undefined
 * - querySelectorAll on null element returns empty NodeList (safe)
 *
 * **Style Conditions**:
 * - Checks if current overflowY is 'auto' or 'scroll' (scrollable)
 * - Only modifies if currently non-scrollable
 * - Does not override explicit overflowY: hidden or overflowY: visible
 * - Inline style assignment takes precedence over CSS rules
 *
 * **Performance Considerations**:
 * - querySelectorAll: O(n) where n = total elements in subtree
 * - forEach iteration: O(m) where m = matched scrollable containers
 * - Style assignment: O(1) per element (inline style update)
 * - Multiple calls safe (idempotent if already scrollable)
 *
 * **Side Effects**:
 * - Modifies HTMLElement.style.overflowY property (DOM mutation)
 * - May trigger style recalculation and layout reflow
 * - Affects visual rendering of scroll indicators
 *
 * @example
 * Enable scroll for gallery after inserting items:
 *
 * const galleryContainer = document.querySelector('[role="feed"]');
 * ensureGalleryScrollAvailable(galleryContainer);
 *
 * Safe with null element:
 *
 * const container = document.querySelector('.optional-gallery');
 * ensureGalleryScrollAvailable(container); // Returns early if null
 *
 * Re-enable scroll after mutation:
 *
 * mutation.addedNodes.forEach(node => {
 *   if (node instanceof HTMLElement) {
 *     ensureGalleryScrollAvailable(node);
 *   }
 * });
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
