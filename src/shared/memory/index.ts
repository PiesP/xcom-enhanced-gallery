/**
 * @fileoverview Core Memory Management Barrel Export
 */

// Memory tracking and management
export {
  MemoryTracker,
  memoryTracker,
  getMemoryInfo,
  getMemoryUsageMB,
  getMemoryStatus,
  triggerGarbageCollection,
  checkMemoryAndCleanup,
  type MemoryInfo,
  MEMORY_THRESHOLDS,
} from './MemoryTracker';
