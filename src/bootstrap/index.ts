/**
 * @fileoverview Bootstrap Module Barrel Export
 * @description Central export point for all bootstrap utilities
 */

export { initializeEnvironment } from './environment';
export {
  getBootstrapDiagnostics,
  logBootstrapSummary,
  checkServiceAvailability,
} from './bootstrap-info';
export type { BootstrapResult, ServiceAvailabilityInfo } from './bootstrap-info';
// Phase 343: Error Handling Standardization
export type { BootstrapErrorStrategy, BootstrapSystemType } from './types';
export {
  CRITICAL_ERROR_STRATEGY,
  NON_CRITICAL_ERROR_STRATEGY,
  getErrorStrategy,
  handleBootstrapError,
} from './types';
// Phase 326: Code Splitting - 프리로드 전략
export { preloadCriticalChunks, preloadOptionalChunks, executePreloadStrategy } from './preload';

// Phase 2.1: 부트스트랩 로직 모듈화
export { initializeCriticalSystems } from './critical-systems';
export { initializeCoreBaseServices } from './base-services';
export { initializeDevTools } from './dev-tools';
export { initializeGalleryApp, getGalleryApp, clearGalleryApp } from './gallery-init';
