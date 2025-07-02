/**
 * @fileoverview Performance Utilities Barrel Export
 * @version 4.0.0 - Enhanced Clean Architecture implementation
 */

// 기본 성능 유틸리티 (debounce, throttle, RAF)
export * from './BasicUtilities';

// 성능 모니터링
export * from './AdvancedPerformanceMonitor';

// 간소화된 디바운싱 시스템
export { Debouncer, createDebouncer, debounce } from './Debouncer';

// 미디어 클릭 디바운서
export {
  MediaClickDebouncer,
  createMediaClickDebouncer,
  type MediaClickContext,
  type MediaClickDebouncerOptions,
} from './MediaClickDebouncer';
