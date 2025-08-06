/**
 * @fileoverview 통합 성능 유틸리티 - TDD GREEN 완료
 * @description 중복 제거 완료된 성능 유틸리티의 단일 진입점
 * @version 3.0.0 - TDD 기반 통합 완료
 */

// 통합된 PerformanceUtils로부터 모든 성능 함수 제공
export {
  PerformanceUtils,
  rafThrottle,
  throttle,
  debounce,
  createDebouncer,
  measurePerformance,
  Debouncer,
  TimerService,
  globalTimerService,
  delay,
  ResourceService,
  type ResourceType,
  globalResourceService,
  registerResource,
  releaseResource,
  releaseAllResources,
} from './performance/unified-performance-utils';

// memo 함수는 optimization 모듈에서 제공
export { memo } from './optimization/memo';
