/**
 * Infrastructure DOM Utilities Barrel Export
 *
 * DOM 관련 인프라스트럭처 유틸리티들을 export합니다.
 */

// Unified DOM utilities (primary interface)
export {
  UnifiedDOMUtils,
  type DOMElementCreationOptions,
  type ScrollLockOptions,
} from './unified-dom-utils';

// Unified scroll manager
export { scrollManager } from './ScrollLockService';

// Named exports for convenience
export {
  addEventListener,
  createElement,
  getScrollPosition,
  isElement,
  isElementInViewport,
  isElementVisible,
  isHTMLElement,
  isScrollLocked,
  lockPageScroll,
  querySelector,
  querySelectorAll,
  removeElement,
  removeEventListener,
  unlockPageScroll,
} from './unified-dom-utils';
