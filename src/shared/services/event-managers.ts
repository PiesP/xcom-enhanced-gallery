/**
 * @fileoverview 통합 이벤트 관리자 인덱스
 * @description 이벤트 관리자들의 중앙 집중화된 진입점
 */

// 새로운 이벤트 관리자 (권장)
export { EventManager, TwitterEventManager } from './EventManager';

// 레거시 호환성 제거: 외부로 더 이상 노출하지 않음 (S3)
// 기존 코드는 EventManager를 통해 접근해야 합니다.

// 기본 export
export { EventManager as default } from './EventManager';
