/**
 * Infrastructure Memory Management - Access Point
 *
 * ResourceManager로 통합된 리소스 관리와 메모리 관리 기능을 제공합니다.
 * @see ResourceManager in @core/managers
 */

// 통합된 리소스 관리자로 리다이렉트
export {
  ResourceManager,
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
} from '@core/managers/ResourceManager';

// 메모리 상태 관리
export {
  MemoryTracker,
  memoryTracker,
  getMemoryInfo,
  getMemoryUsageMB,
  getMemoryStatus,
  triggerGarbageCollection,
  checkMemoryAndCleanup,
} from './MemoryTracker';
