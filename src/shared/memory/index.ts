/**
 * @fileoverview 통합된 메모리 관리 - TDD Priority 1 완료
 * @description 중복 제거된 단일 메모리 관리자 export
 * @version 2.0.0 - 통합 완료
 */

// 통합된 메모리 관리자 - 모든 중복 기능 포함
export * from './unified-memory-manager';

// 호환성을 위한 기존 API 별명
export { memoryManager as memoryService } from './unified-memory-manager';
export {
  UnifiedMemoryManager as MemoryTracker,
  memoryManager as memoryTracker,
} from './unified-memory-manager';
