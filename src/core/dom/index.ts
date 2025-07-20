/**
 * @fileoverview Core DOM Utilities Barrel Export
 */

export { DOMEventManager, createEventManager } from './DOMEventManager';

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
