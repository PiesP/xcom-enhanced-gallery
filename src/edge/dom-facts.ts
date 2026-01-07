/**
 * @fileoverview DOM facts collection for Edge layer browser context
 *
 * Provides utilities to capture current DOM state and page information in the
 * Edge layer (browser/userscript context). Collects facts about media galleries,
 * XEG overlays, and page URL for use by core business logic and UI components.
 *
 * @remarks
 * **Purpose**:
 * - Capture current DOM state (gallery overlays, media viewers, element counts)
 * - Collect page metadata (current URL)
 * - Provide safe access to DOM information in browser context
 * - Support decision-making about gallery initialization and UI visibility
 *
 * **Architecture Pattern**:
 * - **Layer**: Edge (browser/userscript execution context)
 * - **Scope**: Query DOM directly, return immutable snapshot
 * - **Safety**: Handles missing document gracefully (non-browser contexts)
 * - **Selectors**: Uses stable selectors from @shared/dom/selectors
 * - **Facts Collected**: URL, overlay visibility, media viewer presence, media count
 *
 * **Design Principles**:
 * 1. **Defensive Programming**: Checks document existence before querying
 * 2. **Selector Stability**: Uses pre-defined stable selectors (X.com resistant)
 * 3. **Immutable Results**: Returns object snapshot, doesn't modify DOM
 * 4. **Fallback Selectors**: Uses queryAllWithFallback for robust element detection
 * 5. **Type Safety**: Returns typed DomFacts interface with kind discriminator
 *
 * **DOM Queries**:
 * - Gallery overlay: Check if XEG custom overlay exists via data-attribute
 * - Media viewers: Query for X.com media viewer elements with fallback selectors
 * - Media containers: Count stable media container elements (resilient to changes)
 * - URL: Get safe current location via getSafeHref() utility
 *
 * **Use Cases**:
 * - Determine if gallery UI should be visible
 * - Check if X.com media viewer is active
 * - Count available media elements for display
 * - Get current page URL for feature filtering
 *
 * **Related Selectors**:
 * - GALLERY_OVERLAY_SELECTOR: XEG overlay container
 * - STABLE_MEDIA_VIEWERS_SELECTORS: X.com media viewer fallbacks
 * - STABLE_MEDIA_CONTAINERS_SELECTORS: Media item containers (images/videos)
 *
 * @module edge/dom-facts
 * @see {@link DomFacts} for return type interface
 * @see {@link DomFactsKind} for fact type discrimination
 * @see {@link getSafeHref} for URL retrieval
 * @see {@link queryAllWithFallback} for robust element querying
 */

import type { DomFacts, DomFactsKind } from '@core/dom-facts';
import { getSafeHref } from '@shared/dom/safe-location';
import {
  GALLERY_OVERLAY_SELECTOR,
  queryAllWithFallback,
  STABLE_MEDIA_CONTAINERS_SELECTORS,
  STABLE_MEDIA_VIEWERS_SELECTORS,
} from '@shared/dom/selectors';

/**
 * Capture current DOM facts and page state
 *
 * Takes a snapshot of the current DOM and page state, returning facts about
 * gallery overlays, media viewers, element counts, and URL. Safe to call in
 * non-browser contexts (returns default facts if document unavailable).
 *
 * @param kind - DomFactsKind discriminator indicating the context/origin of this fact check
 * @returns DomFacts object containing current DOM state and page information
 *
 * @remarks
 * **Fact Collection**:
 * - `kind`: Preserved from input (discriminator for fact type)
 * - `url`: Current page URL via getSafeHref(), or empty string if unavailable
 * - `hasXegOverlay`: True if XEG gallery overlay is present in DOM
 * - `hasXComMediaViewer`: True if X.com media viewer is active
 * - `mediaElementsCount`: Count of stable media container elements
 *
 * **Browser Context Checking**:
 * - Checks `typeof document !== 'undefined'` before DOM queries
 * - Returns default facts if document unavailable (SSR, workers, etc.)
 * - Safe to call from any execution context
 *
 * **Selector Logic**:
 * - Gallery overlay: Single querySelector (unique overlay element)
 * - Media viewers: queryAllWithFallback (resilient to X.com DOM changes)
 * - Media containers: queryAllWithFallback (stable container selectors)
 * - All selectors defined in @shared/dom/selectors for maintainability
 *
 * **Default Fact Values**:
 * - kind: Passed through from input
 * - url: Empty string if getSafeHref() returns null
 * - hasXegOverlay: false (if document unavailable)
 * - hasXComMediaViewer: false (if document unavailable)
 * - mediaElementsCount: 0 (if document unavailable)
 *
 * **Performance**:
 * - O(n) querySelectorAll operations (n = elements in document)
 * - Queries optimized via fallback selectors
 * - Snapshot operation (no mutation, no observers)
 *
 * **Type Safety**:
 * - Input: kind parameter typed as DomFactsKind
 * - Output: Returns DomFacts interface with all required fields
 * - Discriminated union support via kind field
 *
 * @example
 * Check gallery overlay presence:
 *
 * const facts = takeDomFacts('initial');
 * if (facts.hasXegOverlay) {
 *   console.log('Gallery UI is active');
 * }
 *
 * Monitor media element count changes:
 *
 * const beforeFacts = takeDomFacts('before-insert');
 * // Insert new media elements...
 * const afterFacts = takeDomFacts('after-insert');
 * if (afterFacts.mediaElementsCount > beforeFacts.mediaElementsCount) {
 *   console.log('Media elements were added');
 * }
 *
 * Safe call in non-browser context:
 *
 * const facts = takeDomFacts('worker');
 * // Returns default facts without throwing error
 * console.log(facts.mediaElementsCount); // 0
 *
 * Check for media viewer state:
 *
 * const facts = takeDomFacts('check');
 * if (facts.hasXComMediaViewer) {
 *   console.log('Media viewer active, gallery may be hidden');
 * }
 */
export function takeDomFacts(kind: DomFactsKind): DomFacts {
  const url = getSafeHref() ?? '';

  if (typeof document === 'undefined') {
    return {
      kind,
      url,
      hasXegOverlay: false,
      hasXComMediaViewer: false,
      mediaElementsCount: 0,
    };
  }

  const hasXegOverlay = !!document.querySelector(GALLERY_OVERLAY_SELECTOR);
  const hasXComMediaViewer =
    queryAllWithFallback(document, STABLE_MEDIA_VIEWERS_SELECTORS).length > 0;
  const mediaElementsCount = queryAllWithFallback(
    document,
    STABLE_MEDIA_CONTAINERS_SELECTORS
  ).length;

  return { kind, url, hasXegOverlay, hasXComMediaViewer, mediaElementsCount };
}
