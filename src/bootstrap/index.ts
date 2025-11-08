/**
 * @fileoverview Bootstrap Module Barrel Export
 * @description Central export point for all bootstrap utilities
 */

export { initializeEnvironment } from './environment';
export {
  getBootstrapDiagnostics,
  logBootstrapSummary,
  checkAllServices as checkServiceAvailability,
} from './diagnostics';
export type { BootstrapResult, ServiceAvailabilityInfo } from './diagnostics';
// Phase 343: Error Handling Standardization
export type { BootstrapErrorStrategy, BootstrapSystemType } from './types';
export {
  CRITICAL_ERROR_STRATEGY,
  NON_CRITICAL_ERROR_STRATEGY,
  getErrorStrategy,
  handleBootstrapError,
} from './types';
// Phase 326: Code Splitting - preload strategy
export { preloadCriticalChunks, preloadOptionalChunks, executePreloadStrategy } from './preload';

// Phase 2.1: Bootstrap logic modularization
export { initializeCriticalSystems } from './critical-systems';
export { initializeCoreBaseServices } from './base-services';
export { initializeDevTools } from './dev-tools';
export { initializeGalleryApp, getGalleryApp, clearGalleryApp } from './gallery-init';
