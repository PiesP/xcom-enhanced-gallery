/**
 * Infrastructure DOM Utilities Barrel Export
 *
 * DOM 관련 인프라스트럭처 유틸리티들을 export합니다.
 */

// DOM utilities (primary interface)
export { DOMUtils, type DOMElementCreationOptions, type ScrollLockOptions } from './dom-utils';

// Legacy scroll service removed - use core/services/scroll/ScrollManager instead

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
} from './dom-utils';
