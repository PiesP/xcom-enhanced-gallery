/**
 * @fileoverview DOM 모듈 통합 export
 * @description TDD 기반 DOM 통합 - DOMService 중심 API
 */

// ===== 주된 통합 DOM 서비스 =====
export * from './DOMService';

// ===== 지원 구현체들 =====
export { DOMCache, globalDOMCache } from './DOMCache';
export { DOMEventManager, createEventManager } from './dom-event-manager';

// DOMManager는 DOMService로 통합됨 - 새로운 코드에서는 DOMService 사용 권장
