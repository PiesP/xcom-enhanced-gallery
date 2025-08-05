/**
 * @fileoverview DOM 모듈 통합 export
 * @description TDD 기반 DOM 통합 - DOMService를 주된 API로 사용
 */

// ===== 주된 통합 DOM 서비스 =====
export * from './DOMService';

// ===== 내부 구현체들 (호환성 유지) =====
// 기존 코드와의 호환성을 위해 별칭으로 export
export { DOMCache, globalDOMCache } from './DOMCache';

export { DOMEventManager, createEventManager } from './dom-event-manager';

// ===== 레거시 호환성 =====
// 기존 DOM 유틸리티들을 namespace로 분리하여 충돌 방지
export * as LegacyDOMManager from './dom-manager';
