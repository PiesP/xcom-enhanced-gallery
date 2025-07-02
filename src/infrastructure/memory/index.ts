/**
 * Infrastructure Memory Management Barrel Export
 *
 * @deprecated 이 모듈들은 deprecated 되었습니다.
 * @see UnifiedResourceManager in @infrastructure/managers 사용 권장
 *
 * 메모리 자원 관리를 위한 유틸리티들을 export합니다.
 */

// @deprecated Use UnifiedResourceManager instead
export * from './UnifiedMemoryManager';

// @deprecated Use UnifiedResourceManager instead
export * from './ResourcePool';

// @deprecated Use UnifiedResourceManager instead
export * from './EventManager';

// 편의를 위한 별칭 export
export { ResourcePool as resourcePool } from './ResourcePool';
