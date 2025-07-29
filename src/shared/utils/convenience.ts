/**
 * @fileoverview 편의 함수들 (통합됨) - Phase 5 최적화
 * @version 2.1.0 - Bundle Optimization
 *
 * Phase 5에서 성능 함수들을 별도 모듈로 분리
 */

// Re-export from appropriate modules for backward compatibility
export { safeQuerySelector as safeQuery } from './core-utils';
export {
  createDebouncer as debounce,
  rafThrottle as throttle,
} from './performance/performance-utils';
