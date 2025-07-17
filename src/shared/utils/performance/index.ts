/**
 * @fileoverview Performance Utilities
 */

// Throttle 유틸리티 (우선 export)
export { rafThrottle, throttle, throttleScroll, type RafThrottleOptions } from './throttle';

// 기본 성능 유틸리티
export {
  scheduleWork,
  measurePerformance,
  measureAsyncPerformance,
  setupLazyLoading,
} from './performance-utils';

export { Debouncer, createDebouncer, debounce } from './Debouncer';

export { PerformanceMonitor, performanceTrack, profileApplicationDev } from './PerformanceMonitor';

export {
  ClickDebouncer,
  createClickDebouncer,
  type ClickContext,
  type ClickDebouncerOptions,
} from './ClickDebouncer';
