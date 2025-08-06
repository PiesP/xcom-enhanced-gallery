/**
 * @fileoverview Memory utilities index
 */

export {
  ResourceService,
  registerResource,
  releaseResource,
  releaseAllResources,
  type ResourceType,
} from './resource-service';

// Legacy aliases for compatibility
export { registerResource as registerManagedMemoryResource } from './resource-service';
export { releaseResource as releaseResourcesByType } from './resource-service';
export { releaseAllResources as cleanupAllResources } from './resource-service';

// Mock/stub exports for non-implemented functions
export const createTimer = () => ({ cleanup: () => {} });
export const createManagedInterval = () => ({ cleanup: () => {} });
export const addManagedEventListener = () => ({ cleanup: () => {} });
export const createManagedObserver = () => ({ cleanup: () => {} });
export const createManagedController = () => ({ cleanup: () => {} });
export const createManagedObjectURL = () => ({ cleanup: () => {} });
export const releaseResourcesByContext = () => {};
export const getResourceCount = () => 0;
export const hasResource = () => false;
