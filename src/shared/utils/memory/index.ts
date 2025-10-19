/**
 * @fileoverview Phase H: Memory utilities
 * @description Direct function exports for better tree-shaking (총 8개 export)
 * @version 4.1.0 - Phase 132: 하위 호환성 별칭 제거
 */

// === Core Resource Management (6개) ===
export {
  ResourceManager,
  globalResourceManager,
  registerResource,
  releaseResource,
  releaseAllResources,
  type ResourceType,
} from './resource-manager';

// === Convenience Functions (2개) ===
import { globalResourceManager } from './resource-manager';

export const getResourceCount = () => globalResourceManager.getResourceCount();
export const hasResource = (id: string) => globalResourceManager.hasResource(id);

// === Memory Profiling & Diagnostics (5개) ===
export {
  isMemoryProfilingSupported,
  takeMemorySnapshot,
  MemoryProfiler,
  type MemorySnapshot,
  type MemoryProfileResult,
} from './memory-profiler';
