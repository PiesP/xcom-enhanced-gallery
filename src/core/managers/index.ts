/**
 * Core Managers Export
 *
 * Phase 2B Step 3: 핵심 관리 컴포넌트만 export
 */

// Essential managers
export { EventDispatcher } from './EventDispatcher';
export { NamespacedDesignSystem, namespacedDesignSystem } from './NamespacedDesignSystem';

// Resource management
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
