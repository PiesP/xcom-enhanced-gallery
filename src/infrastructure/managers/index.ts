/**
 * @fileoverview Infrastructure Managers - Re-export Layer
 * @version 2.0.0 - Clean Architecture Implementation
 * @description Infrastructure 레이어에서 Core managers로의 재수출
 * @migrate Phase 2A Step 5 - Core managers migration
 * @deprecated Use @core/managers instead
 */

// Core managers 재수출
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
  type ResourceEntry,
  type TimerResource,
  type IntervalResource,
  type EventResource,
  type ObserverResource,
  type ControllerResource,
  type URLResource,
  type MemoryResource,
  type ResourceType,
  type ResourceContext,
} from './ResourceManager';

export { NamespacedDesignSystem, namespacedDesignSystem } from './NamespacedDesignSystem';
