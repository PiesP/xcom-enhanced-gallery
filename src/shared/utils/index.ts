/**
 * @fileoverview Week 2 TDD: 통합 유틸리티 메인 진입점
 * @description 스타일/성능 유틸리티 통합 완료, DOM 기능은 @shared/dom으로 분리
 * @version 6.0.0 - TDD Week 2 통합
 */

// 🎯 Week 2 메인: 통합 유틸리티 모듈
export * from './integrated-utils';
export { default as IntegratedUtils } from './integrated-utils';

// === 핵심 유틸리티 (8개) ===
export {
  setCSSVariable,
  removeDuplicates,
  canTriggerGallery,
  isGalleryInternalElement,
  ensureGalleryScrollAvailable,
  findTwitterScrollContainer,
} from './utils';

// === 성능 관련 (2개) ===
export { rafThrottle } from '@shared/utils/performance/performance-utils-enhanced';
export { createDebouncer } from '@shared/utils/timer-management';

// === 최적화 유틸리티 ===
export * from './optimization/optimization-utils';

// === 타이머 관리 (2개) ===
export {
  TimerService as TimerManager,
  globalTimerService as globalTimerManager,
} from './timer-management';

// === 타입 안전 유틸리티 (4개) ===
export {
  safeParseInt,
  safeParseFloat,
  undefinedToNull,
  safeElementCheck,
} from './type-safety-helpers';

// === 핵심 DOM (3개) - safeQuerySelector는 @shared/dom으로 이동됨 ===
export { isInsideGallery, extractTweetInfoFromUrl } from './core-utils';

// === 접근성 및 이벤트 (5개) ===
export { getRelativeLuminance, parseColor, detectLightBackground } from './accessibility';
export { addListener, cleanupEventListeners } from './events';

// === 미디어 (1개) ===
export { imageFilter } from './media/image-filter';

// === DOM 배처 관련 제거됨 (deprecated) ===

// === 디버그 유틸리티 (1개) ===
export { galleryDebugUtils } from './debug/gallery-debug';
