/**
 * @fileoverview 단순화된 매니저들
 * @description 유저스크립트에 필요한 핵심 매니저들만 유지
 */

// 네임스페이스 디자인 시스템 (갤러리 스타일링에 필요)
export { NamespacedDesignSystem, namespacedDesignSystem } from './NamespacedDesignSystem';

// 리소스 매니저 (메모리 관리에 필요)
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
