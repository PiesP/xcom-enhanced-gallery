/**
 * @fileoverview Infrastructure Managers Barrel Export
 * @version 2.0.0 - 통합된 리소스 관리자
 * @description 모든 인프라 관리자들을 통합하여 export
 */

// 통합 리소스 매니저
export {
  UnifiedResourceManager,
  resourceManager,
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
} from './UnifiedResourceManager';
