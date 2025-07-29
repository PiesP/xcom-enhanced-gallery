/**
 * Core Managers Export
 *
 * Phase 4: 리소스 관리자 통합 완료
 */

// Essential managers
// EventDispatcher는 Phase 3에서 제거됨 - @shared/utils/event-dispatcher 사용
// NamespacedDesignSystem은 단순 함수로 대체됨 - @shared/styles/namespaced-styles 사용

// Resource management (단순화된 함수들)
export {
  resourceManager,
  createTimer,
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

// Phase 4: 런타임 성능 최적화 리소스 관리자
export { ResourceManager } from './ResourceManager';
