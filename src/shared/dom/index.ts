/**
 * @fileoverview Core DOM Utilities Barrel Export - 통합 DOM 서비스 기반
 */

// 🆕 통합 DOM 서비스 (새로운 단일 API)
export { default as DOMService } from './DOMService';
export {
  querySelector,
  querySelectorAll,
  createElement,
  addEventListener,
  removeEventListener,
  addClass,
  removeClass,
  setStyle,
  removeElement,
  isVisible,
  isInViewport,
  type ElementOptions,
  type EventOptions,
} from './DOMService';

export { DOMEventManager, createEventManager } from './DOMEventManager';

// 레거시 호환성 (단계적 제거 예정)
export {
  DOMManager,
  globalDOMManager,
  select,
  selectAll,
  cachedSelect,
  cachedSelectAll,
  batchUpdate,
  batchUpdateMany,
  safeQuerySelector,
  isInsideGallery,
  type DOMElementCreationOptions,
} from './DOMManager';

// 레거시 DOM utilities (단계적 제거 예정)
export {
  DOMUtils,
  type DOMElementCreationOptions as LegacyDOMElementCreationOptions,
} from '@shared/services/unified-dom-service';

// 레거시 DOM 캐싱 시스템 (단계적 제거 예정)
export {
  DOMCache,
  globalDOMCache,
  cachedQuerySelector,
  cachedQuerySelectorAll,
  cachedStableQuery,
  invalidateCacheOnMutation,
} from './DOMCache';

// Named exports for convenience (레거시) - 중복 제거됨
// 새로운 DOMService를 사용하세요
