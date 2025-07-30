/**
 * @fileoverview Phase G Week 2: Memory utilities unified
 * @description Direct function exports for better tree-shaking
 * @version 3.0.0 - Bundle Size Optimization
 */

// Phase G Week 2: Use direct function imports from resource-manager
export {
  createTimer,
  createManagedInterval,
  addManagedEventListener,
  createManagedObserver,
  createManagedController,
  createManagedObjectURL,
  registerManagedMemoryResource,
  releaseResource,
  releaseResourcesByContext,
  releaseResourcesByType,
  cleanupAllResources,
  getResourceCount,
  hasResource,
  type ResourceType,
} from '../resource-manager';

// Backward compatibility - use ResourceManager class from ResourceManager.ts
export { ResourceManager } from './ResourceManager';
