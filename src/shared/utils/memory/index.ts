/**
 * @fileoverview Phase H: Memory utilities
 * @description Direct function exports for better tree-shaking
 * @version 4.0.0 - Phase H: Final cleanup
 */

// ResourceManager 클래스와 편의 함수들
export {
  ResourceManager,
  globalResourceManager,
  registerResource,
  releaseResource,
  releaseAllResources,
  type ResourceType,
} from './ResourceManager';

// 하위 호환성을 위한 별칭들
export {
  releaseAllResources as cleanupAllResources,
  globalResourceManager as createManagedController,
  registerResource as registerManagedMemoryResource,
  releaseResource as releaseResourcesByContext,
  releaseResource as releaseResourcesByType,
  globalResourceManager as createTimer,
  globalResourceManager as createManagedInterval,
  globalResourceManager as addManagedEventListener,
  globalResourceManager as createManagedObserver,
} from './ResourceManager';

// 편의 함수들
import { globalResourceManager } from './ResourceManager';
export const getResourceCount = () => globalResourceManager.getResourceCount();
export const hasResource = (id: string) => globalResourceManager.hasResource(id);

// Memory profiler (lightweight, optional)
export {
  isMemoryProfilingSupported,
  takeMemorySnapshot,
  MemoryProfiler,
  type MemorySnapshot,
  type MemoryProfileResult,
} from './memory-profiler';

// Object URL manager
export { createManagedObjectURL, revokeManagedObjectURL } from './object-url-manager';
