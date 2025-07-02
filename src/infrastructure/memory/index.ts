/**
 * Infrastructure Memory Management - Unified Access Point
 *
 * UnifiedResourceManager로 통합되었으므로 해당 모듈 사용을 권장합니다.
 * @see UnifiedResourceManager in @infrastructure/managers
 */

// 통합된 리소스 관리자로 리다이렉트
export {
  UnifiedResourceManager,
  createManagedTimer,
  createManagedInterval,
  addManagedEventListener,
  createManagedObserver,
  createManagedController,
  createManagedObjectURL,
  registerManagedMemoryResource,
  releaseResource,
  releaseResourcesByContext,
  cleanupAllResources,
} from '@infrastructure/managers/UnifiedResourceManager';

// 메모리 상태 관리
export {
  UnifiedMemoryManager,
  memoryManager,
  getMemoryInfo,
  getMemoryUsageMB,
  getMemoryStatus,
  triggerGarbageCollection,
  checkMemoryAndCleanup,
} from './UnifiedMemoryManager';
