/**
 * @fileoverview Memory 유틸리티 재사용 모듈 (간단한 리소스 매니저)
 * @description Phase C2: 복잡한 메모리 풀을 간단한 리소스 매니저로 단순화
 */

// Phase C2: 기본 리소스 매니저로 대체
export { SimpleResourceManager } from './SimpleResourceManager';
export type { ResourceType } from './SimpleResourceManager';

// 하위 호환성을 위한 별칭
export { SimpleResourceManager as MemoryPoolManager } from './SimpleResourceManager';
export { SimpleResourceManager as resourceManager } from './SimpleResourceManager';
