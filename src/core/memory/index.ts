/**
 * @fileoverview Core Memory Manager - TDD Phase 2 완료
 * @description 통합된 UnifiedMemoryManager로 완전 교체
 * @version 2.0.0 - Phase 2: 중복 제거 완료
 */

// 통합된 메모리 관리자 사용
export {
  UnifiedMemoryManager as CoreMemoryManager,
  memoryManager,
  memoryManager as coreMemoryManager,
  type ResourceType,
  type ResourceEntry,
  type MemoryUsage,
  type MemoryStatus,
  MEMORY_THRESHOLDS,
} from '@shared/memory/unified-memory-manager';
