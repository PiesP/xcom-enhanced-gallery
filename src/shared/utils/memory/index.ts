/**
 * @fileoverview Memory 유틸리티 재사용 모듈 (리소스 매니저)
 * @description Phase C2/Phase 3: 복잡한 메모리 풀을 간단한 리소스 매니저로 단순화, 네이밍 정리
 */

// Phase 3: 명확한 이름으로 변경
export { ResourceManager } from './ResourceManager';
export type { ResourceType } from './ResourceManager';

// 하위 호환성을 위한 별칭
export { ResourceManager as BasicResourceManager } from './ResourceManager';
export { ResourceManager as MemoryPoolManager } from './ResourceManager';
export { ResourceManager as resourceManager } from './ResourceManager';
