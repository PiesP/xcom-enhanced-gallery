/**
 * @fileoverview Core DOM Utilities Barrel Export
 * Note: DOMEventManager is intentionally NOT re-exported to prevent external runtime imports.
 * Internal modules should import from './DOMEventManager' via relative path when necessary.
 */

// Core DOM utilities (moved from Infrastructure)
export { DOMUtils, type DOMElementCreationOptions } from './utils/dom-utils';

// DOM 캐싱 시스템
export {
  DOMCache,
  globalDOMCache,
  cachedQuerySelector,
  cachedQuerySelectorAll,
  cachedStableQuery,
  invalidateCacheOnMutation,
} from './DOMCache';

// SelectorRegistry
export {
  SelectorRegistry,
  createSelectorRegistry,
  type ISelectorRegistry,
  type QueryContainer,
} from './SelectorRegistry';

// Named exports for convenience
export {
  addEventListener,
  createElement,
  isElement,
  isElementInViewport,
  isElementVisible,
  isHTMLElement,
  querySelector,
  querySelectorAll,
  removeElement,
  removeEventListener,
} from './utils/dom-utils';
