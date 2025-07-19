/**
 * @fileoverview Core Managers - System Management Components
 * @version 2.0.0 - Clean Architecture Implementation
 * @description Core 레이어의 관리자 컴포넌트들
 */

export { EventDispatcher } from './EventDispatcher';

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

// 네임스페이스된 디자인 시스템
export { NamespacedDesignSystem, namespacedDesignSystem } from './NamespacedDesignSystem';
