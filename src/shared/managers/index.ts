/**
 * Core Managers Export
 *
 * Phase 2B Step 3: 핵심 관리 컴포넌트만 export
 */

// Essential managers
export { EventDispatcher } from './EventDispatcher';
// NamespacedDesignSystem은 단순 함수로 대체됨 - @shared/styles/namespaced-styles 사용

// Resource management (단순화된 함수들)
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
} from '@shared/utils/resource-manager';
