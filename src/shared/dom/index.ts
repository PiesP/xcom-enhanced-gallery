/**
 * @fileoverview Core DOM Utilities Barrel Export
 * Note: DOMEventManager is intentionally NOT re-exported to prevent external runtime imports.
 * Internal modules should import from './dom-event-manager' via relative path when necessary.
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
export {
  addEventListener,
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
  removeEventListener,
} from './utils/dom-utils';
