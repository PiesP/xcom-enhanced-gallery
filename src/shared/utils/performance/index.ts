/**
 * @fileoverview Performance Optimization Exports
 * @description 성능 최적화 관련 모든 유틸리티 통합 내보내기
 * @version 2.0.0 - Phase 352: Named export 최적화
 */

// Performance utilities
export {
  Debouncer,
  createDebouncer,
  rafThrottle,
  throttleScroll,
  measurePerformance,
  measureAsyncPerformance,
} from './performance-utils';

// Preload utilities
export { computePreloadIndices } from './preload';

// Idle scheduler
export type { IdleScheduleOptions, IdleHandle } from './idle-scheduler';
export { scheduleIdle } from './idle-scheduler';

// Schedulers
export type { SchedulerHandle } from './schedulers';
export { scheduleRaf, scheduleMicrotask } from './schedulers';

// Prefetch benchmark
export type {
  PrefetchBenchMode,
  PrefetchBenchConfig,
  PrefetchBenchEntry,
  PrefetchBenchReport,
} from './prefetch-bench';
export { runPrefetchBench } from './prefetch-bench';

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
