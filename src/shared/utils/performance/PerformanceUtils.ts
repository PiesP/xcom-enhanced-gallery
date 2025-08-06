/**
 * @fileoverview 호환성을 위한 PerformanceUtils 클래스 리다이렉트
 * @description 기존 코드와의 호환성을 위해 unified-performance-utils로 리다이렉트
 * @deprecated Use @shared/utils/performance/unified-performance-utils instead
 */

// 통합된 성능 유틸리티로 모든 함수 리다이렉트
export {
  PerformanceUtils,
  rafThrottle,
  throttle,
  debounce,
  createDebouncer,
  measurePerformance,
  measurePerformanceAsync,
  delay,
  Debouncer,
  TimerService,
  globalTimerService,
  ResourceService,
  globalResourceService,
  registerResource,
  releaseResource,
  releaseAllResources,
  throttleScroll,
} from './unified-performance-utils';

// 기본 export도 호환성을 위해 제공
export { PerformanceUtils as default } from './unified-performance-utils';
