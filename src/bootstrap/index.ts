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
// Phase 326: Code Splitting - 프리로드 전략
export { preloadCriticalChunks, preloadOptionalChunks, executePreloadStrategy } from './preload';
