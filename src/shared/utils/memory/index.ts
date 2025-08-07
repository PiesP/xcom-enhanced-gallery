/**
 * @fileoverview 🟢 GREEN: Memory utilities index - 통합 완료
 * @description UnifiedMemoryManager 기반으로 통합된 메모리 유틸리티들
 * @version 2.0.0 - TDD GREEN Phase
 */

// 🟢 GREEN: 통합된 메모리 관리 유틸리티들
export {
  ResourceService,
  registerResource,
  releaseResource,
  releaseAllResources,
  globalResourceManager,
  type ResourceType,
} from './resource-service';

// Legacy aliases for compatibility
export { registerResource as registerManagedMemoryResource } from './resource-service';
export { releaseResource as releaseResourcesByType } from './resource-service';
export { releaseAllResources as cleanupAllResources } from './resource-service';

// Mock/stub exports for non-implemented functions (유저스크립트에서 미사용)
export const createTimer = () => ({ cleanup: () => {} });
export const createManagedInterval = () => ({ cleanup: () => {} });
export const addManagedEventListener = () => ({ cleanup: () => {} });
export const createManagedObserver = () => ({ cleanup: () => {} });
export const createManagedController = () => ({ cleanup: () => {} });
export const createManagedObjectURL = () => ({ cleanup: () => {} });
export const releaseResourcesByContext = () => {};
export const getResourceCount = () => 0;
export const hasResource = () => false;
