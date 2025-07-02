/**
 * Infrastructure Memory Management Barrel Export
 *
 * 메모리 자원 관리를 위한 유틸리티들을 export합니다.
 */

// 통합 자원 관리자 (ResourcePool)
export * from './ResourcePool';

// 편의를 위한 별칭 export
export { resourcePool as memoryManager } from './ResourcePool';

// 이벤트 관리 유틸리티
export { EventManager } from './EventManager';
