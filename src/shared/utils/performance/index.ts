/**
 * @fileoverview Performance Optimization Exports
 * @description Unified export for all performance optimization utilities
 * @version 2.0.0 - Phase 352: Named export optimization
 */

// Performance utilities
export { Debouncer, createDebouncer, rafThrottle, throttleScroll } from './performance-utils';

// Preload utilities
export { computePreloadIndices } from './preload';

// Idle scheduler
export type { IdleScheduleOptions, IdleHandle } from './idle-scheduler';
export { scheduleIdle } from './idle-scheduler';

// Schedulers
export type { SchedulerHandle } from './schedulers';
export { scheduleRaf, scheduleMicrotask } from './schedulers';

// Signal optimization
export {
  createSelector,
  useAsyncSelector,
  useSelector,
  useCombinedSelector,
  getGlobalStats,
  resetGlobalStats,
  setDebugMode,
  isDebugMode,
} from './signal-optimization';
