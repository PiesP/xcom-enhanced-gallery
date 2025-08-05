/**
 * @fileoverview Week 2 TDD: 통합 유틸리티 메인 진입점
 * @description 스타일/성능 유틸리티 통합 완료
 * @version 6.0.0 - TDD Week 2 통합
 */

// 🎯 Week 2 메인: 통합 유틸리티 모듈
export * from './integrated-utils';
export { default as IntegratedUtils } from './integrated-utils';

// === 핵심 유틸리티 (9개) ===
export {
  setCSSVariable,
  removeDuplicates,
  throttleScroll,
  canTriggerGallery,
  isGalleryInternalElement,
  ensureGalleryScrollAvailable,
  findTwitterScrollContainer,
} from './utils';

// === 성능 관련 (2개) ===
export { rafThrottle } from '@shared/utils/performance/performance-utils';
export { createDebouncer } from '@shared/utils/timer-management';

// === 최적화 유틸리티 ===
export * from './optimization/optimization-utils';

// === 타이머 관리 (2개) ===
export { TimerManager, globalTimerManager } from './timer-management';

// === 타입 안전 유틸리티 (4개) ===
export {
  safeParseInt,
  safeParseFloat,
  undefinedToNull,
  safeElementCheck,
} from './type-safety-helpers';

// === 핵심 DOM (3개) ===
export { safeQuerySelector, isInsideGallery, extractTweetInfoFromUrl } from './core-utils';

// === 접근성 및 이벤트 (5개) ===
export { getRelativeLuminance, parseColor, detectLightBackground } from './accessibility';
export { addListener, cleanupEventListeners } from './events';

// === 미디어 (1개) ===
export { imageFilter } from './media/image-filter';

// === DOM 배처 관련 제거됨 (deprecated) ===

// === 디버그 유틸리티 (1개) ===
export { galleryDebugUtils } from './debug/gallery-debug';
