/**
 * @fileoverview Infrastructure Managers Barrel Export
 * @version 2.0.0 - 리소스 관리자
 * @description 모든 인프라 관리자들을 export
 */

// 리소스 매니저
export {
  ResourceManager,
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
} from './ResourceManager';

// 격리된 관리자들
export { NamespacedDesignSystem, namespacedDesignSystem } from './NamespacedDesignSystem';
