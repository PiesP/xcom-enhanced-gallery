/**
 * @fileoverview 통합 이벤트 관리자 인덱스
 * @description 이벤트 관리자들의 중앙 집중화된 진입점
 */

// 통합 이벤트 관리자 (권장)
export { EventManager, TwitterEventManager } from './EventManager';

// 레거시 호환성 유지
export { DOMEventManager, createEventManager } from '@shared/dom/DOMEventManager';

// 기본 export
export { EventManager as default } from './EventManager';
