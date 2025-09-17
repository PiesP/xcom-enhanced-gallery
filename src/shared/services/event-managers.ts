/**
 * @fileoverview 통합 이벤트 관리자 인덱스
 * @description 이벤트 관리자들의 중앙 집중화된 진입점
 */

// 새로운 이벤트 관리자 (권장)
export { EventManager, TwitterEventManager } from './EventManager';

// 레거시 호환성 유지 (deprecated)
export { DOMEventManager, createEventManager } from '@shared/dom/DOMEventManager';
export { GalleryEventManager } from '@shared/utils/events';

// 기본 export
export { EventManager as default } from './EventManager';
