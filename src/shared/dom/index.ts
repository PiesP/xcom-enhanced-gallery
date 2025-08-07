/**
 * @fileoverview DOM 모듈 통합 export - TDD GREEN Phase 2
 * @description 단일 통합 DOM 서비스 중심으로 완전 통합
 */

import {
  UnifiedDOMService,
  unifiedDOMService,
  querySelector,
  querySelectorAll,
  createElement,
  addEventListener,
  removeEventListener,
  setStyle,
  setStyles,
  addClass,
  removeClass,
  toggleClass,
  setAttribute,
  removeAttribute,
  getAttribute,
  batch,
  cleanup,
  DOMService,
  componentManager,
} from './unified-dom-service';

// ===== 개별 named exports - 충돌 방지 =====
export {
  UnifiedDOMService,
  unifiedDOMService,
  querySelector,
  querySelectorAll,
  createElement,
  addEventListener,
  removeEventListener,
  setStyle,
  setStyles,
  addClass,
  removeClass,
  toggleClass,
  setAttribute,
  removeAttribute,
  getAttribute,
  batch,
  cleanup,
  DOMService,
  componentManager,
};

// measurePerformance는 DOM 전용 이름으로 export
export { measurePerformance as measureDOMPerformance } from './unified-dom-service';

// ===== Type exports =====
export type { ElementOptions, EventOptions } from './types';

// ===== Backward Compatibility Classes =====
// 기존 DOM 유틸리티 호환성 - utils/dom.ts 대체
export {
  querySelector as safeQuerySelector,
  querySelectorAll as safeQuerySelectorAll,
  createElement as safeCreateElement,
  addClass as safeAddClass,
  removeClass as safeRemoveClass,
  setStyle as safeSetStyle,
  setAttribute as safeSetAttribute,
  removeAttribute as safeRemoveAttribute,
} from './unified-dom-service';

// DOM 캐시 (이벤트 관리는 unified-dom-service로 통합됨)
export { DOMCache, globalDOMCache } from './dom-cache';

// 기존 DOMService 호환성 (이제 unified-dom-service의 별칭)
export { DOMService as LegacyDOMService } from './unified-dom-service';

// ===== 주요 default export =====
export { unifiedDOMService as default };
