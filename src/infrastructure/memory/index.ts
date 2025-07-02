/**
 * Infrastructure Memory Management Barrel Export
 *
 * 메모리 자원 관리를 위한 유틸리티들을 export합니다.
 */

// 통합 메모리 매니저 (새로운 통합 구현)
export * from './UnifiedMemoryManager';

// 통합 자원 관리자 (ResourcePool)
export * from './ResourcePool';

// 이벤트 관리 유틸리티
export * from './EventManager';

// 편의를 위한 별칭 export
export { ResourcePool as resourcePool } from './ResourcePool';
