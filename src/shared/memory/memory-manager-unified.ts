/**
 * @fileoverview 통합된 메모리 서비스 - 중복 제거 완료
 * @description UnifiedMemoryManager로 완전 교체
 * @version 2.0.0 - TDD Priority 1 완료
 */

// 통합된 메모리 관리자로 완전 교체
export {
  UnifiedMemoryManager as MemoryService,
  memoryManager as memoryService,
  type ResourceType,
  type ResourceEntry,
  type MemoryUsage,
  type MemoryStatus,
  MEMORY_THRESHOLDS,
} from './unified-memory-manager';
