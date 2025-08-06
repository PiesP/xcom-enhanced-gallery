/**
 * @fileoverview DOM 모듈 통합 export
 * @description TDD 기반 DOM 통합 - UnifiedDOMService 중심 API
 */

// ===== 주된 통합 DOM 서비스 =====
export * from './unified-dom-service';

// ===== 기존 서비스들 (호환성) - 명시적 export =====
export {
  DOMService as LegacyDOMService,
  type ElementOptions,
  type EventOptions,
} from './DOMService';

// ===== 지원 구현체들 =====
export { DOMCache, globalDOMCache } from './dom-cache';
export { DOMEventManager, createEventManager } from './dom-event-manager';

// DOMManager는 UnifiedDOMService로 통합됨 - 새로운 코드에서는 UnifiedDOMService 사용 권장
