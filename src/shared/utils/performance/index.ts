/**
 * @fileoverview Performance Utilities Barrel Export
 * @version 4.0.0 - Enhanced Clean Architecture implementation
 */

// 통합된 성능 유틸리티 export
export {
  debounce,
  throttle,
  scheduleWork,
  measurePerformance,
  measureAsyncPerformance,
  setupLazyLoading,
} from './BasicUtilities';

export { Debouncer, createDebouncer } from './Debouncer';

export {
  AdvancedPerformanceMonitor,
  performanceTrack,
  profileApplicationDev,
} from './PerformanceMonitor';

export {
  MediaClickDebouncer,
  createMediaClickDebouncer,
  type MediaClickContext,
  type MediaClickDebouncerOptions,
} from './MediaClickDebouncer';
