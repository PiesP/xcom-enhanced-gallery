/**
 * @fileoverview Memory 유틸리티 재사용 모듈 (간단한 리소스 매니저)
 * @description Phase C2: 복잡한 메모리 풀을 간단한 리소스 매니저로 단순화
 */

// Phase C2: 기본 리소스 매니저로 대체
export { BasicResourceManager } from './BasicResourceManager';
export type { ResourceType } from './BasicResourceManager';

// 하위 호환성을 위한 별칭
export { BasicResourceManager as MemoryPoolManager } from './BasicResourceManager';
export { BasicResourceManager as resourceManager } from './BasicResourceManager';
