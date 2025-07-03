/**
 * Infrastructure DOM Utilities Barrel Export
 *
 * DOM 관련 인프라스트럭처 유틸리티들을 export합니다.
 * 스크롤 관리는 @core/services/scroll/ScrollManager를 사용하세요.
 */

// DOM utilities (primary interface)
export { DOMUtils, type DOMElementCreationOptions } from './dom-utils';

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
