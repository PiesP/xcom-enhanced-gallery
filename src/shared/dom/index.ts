/**
 * @fileoverview Core DOM Utilities Barrel Export - 통합 DOM 매니저 기반
 */

export { DOMEventManager, createEventManager } from './DOMEventManager';

// 🆕 통합 DOM 매니저 (권장)
export {
  UnifiedDOMManager,
  globalDOMManager,
  select,
  selectAll,
  cachedSelect,
  cachedSelectAll,
  createElement,
  batchUpdate,
  batchUpdateMany,
  safeQuerySelector,
  isInsideGallery,
  type DOMElementCreationOptions,
} from './UnifiedDOMManager';

// 레거시 DOM utilities (하위 호환성)
export {
  DOMUtils,
  type DOMElementCreationOptions as LegacyDOMElementCreationOptions,
} from './utils/dom-utils';

// 레거시 DOM 캐싱 시스템 (하위 호환성)
export {
  DOMCache,
  globalDOMCache,
  cachedQuerySelector,
  cachedQuerySelectorAll,
  cachedStableQuery,
  invalidateCacheOnMutation,
} from './DOMCache';

// Named exports for convenience (레거시)
export {
  addEventListener,
  createElement as createElementLegacy,
  isElement,
  isElementInViewport,
  isElementVisible,
  isHTMLElement,
  querySelector,
  querySelectorAll,
  removeElement,
  removeEventListener,
} from './utils/dom-utils';
