/**
 * Infrastructure DOM Utilities Barrel Export
 *
 * DOM 관련 인프라스트럭처 유틸리티들을 export합니다.
 */

// DOM utilities (primary interface)
export { DOMUtils, type DOMElementCreationOptions } from './dom-utils';

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
} from './dom-utils';

// EventManager export
export { DOMEventManager, createEventManager } from './DOMEventManager';
