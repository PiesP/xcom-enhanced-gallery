/**
 * @fileoverview Core DOM Utilities Barrel Export
 * @version 2.2.0 - Phase 195: Event management separation
 *
 * Note: DOMEventManager is intentionally NOT re-exported to prevent external runtime imports.
 * Event management should use BrowserService or DomEventManager (relative import only).
 */

// Core DOM utilities - 함수형 API (Phase 138.1)
export type { DOMElementCreationOptions } from './utils/dom-utils';

// DOM 캐싱 시스템
export {
  DOMCache,
  globalDOMCache,
  cachedQuerySelector,
  cachedQuerySelectorAll,
  cachedStableQuery,
  invalidateCacheOnMutation,
} from './dom-cache';

// SelectorRegistry
export {
  SelectorRegistry,
  createSelectorRegistry,
  type ISelectorRegistry,
  type QueryContainer,
} from './selector-registry';

// Named exports - 함수형 API (Phase 138.1)
// Note: Event management functions (addEventListener, removeEventListener) have been removed
// Use BrowserService or DomEventManager for event handling instead
export {
  createElement,
  elementExists,
  getDebugInfo,
  isElement,
  isElementInViewport,
  isElementVisible,
  isHTMLElement,
  querySelector,
  querySelectorAll,
  removeElement,
} from './utils/dom-utils';
