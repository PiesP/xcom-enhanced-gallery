/**
 * @fileoverview 통합 유틸리티 - Phase G Week 2 모듈화 완료
 * @version 6.0.0 - 모듈화 및 Tree-shaking 최적화
 *
 * Phase G Week 2에서 대형 유틸리티들을 별도 모듈로 분리하여 번들 크기 최적화
 * - Style utilities → styles/style-utils.ts
 * - Scroll utilities → scroll/scroll-utils.ts
 * - Debug utilities → debug/gallery-debug.ts
 * - Gallery utilities → gallery/gallery-utils.ts
 * - Deduplication utilities → deduplication/deduplication-utils.ts
 */

// ================================
// Performance Utilities (Re-exports)
// ================================

// Phase 5: 성능 유틸리티들을 별도 모듈로 분리
export {
  Debouncer,
  createDebouncer,
  rafThrottle,
  measurePerformance,
  measureAsyncPerformance,
} from './performance/performance-utils';

// ================================
// Style Utilities (Re-exports)
// ================================

// Phase G Week 2: 스타일 유틸리티들을 별도 모듈로 분리
export {
  combineClasses,
  toggleClass,
  setCSSVariable,
  setCSSVariables,
  updateComponentState,
  createThemedClassName,
} from './styles/style-utils';

// ================================
// Scroll Utilities (Re-exports)
// ================================

// Phase G Week 2: 스크롤 유틸리티들을 별도 모듈로 분리
export {
  createScrollHandler,
  throttleScroll,
  createScrollDebouncer,
  preventScrollPropagation,
  isGalleryElement,
} from './scroll/scroll-utils';

// Core-utils에서 가져오는 스크롤 유틸리티
export { findTwitterScrollContainer, ensureGalleryScrollAvailable } from './core-utils';

// ================================
// Deduplication Utilities (Re-exports)
// ================================

// Phase G Week 2: 중복 제거 유틸리티들을 별도 모듈로 분리
export {
  removeDuplicates,
  removeDuplicateMediaItems,
  removeDuplicateStrings,
} from './deduplication/deduplication-utils';

// ================================
// Debug Utilities (Re-exports)
// ================================

// Phase G Week 2: 디버그 유틸리티들을 별도 모듈로 분리
export { galleryDebugUtils } from './debug/gallery-debug';

// ================================
// Gallery Utils (Re-exports)
// ================================

// Phase G Week 2: 갤러리 유틸리티들을 별도 모듈로 분리
export { GalleryUtils } from './gallery/gallery-utils';

// 하위 호환성을 위한 별칭들
export { GalleryUtils as GalleryStateGuard } from './gallery/gallery-utils';
