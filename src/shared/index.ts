/**
 * @fileoverview Shared Layer Exports
 * @version 2.0.0 - Phase 2B Step 2 Optimization
 * @description 공통 사용 컴포넌트, 유틸리티, 타입들의 통합 export
 */

// 핵심 UI 컴포넌트들
export * from './components/ui';

// 격리 컴포넌트들 (갤러리 전용)
export * from './components/isolation';

// HOC 컴포넌트들
export * from './components/hoc';

// 핵심 유틸리티들 (주요 기능만)
export {
  // 접근성 & DOM 유틸리티
  calculateContrastRatio,
  detectActualBackgroundColor,
  detectLightBackground,
  getRelativeLuminance,
  meetsWCAGAA,
  meetsWCAGAAA,
  parseColor,
  // 미디어 유틸리티
  imageFilter,
  // 패턴 유틸리티
  extractTweetInfoFromUrl,
  // 성능 유틸리티
  throttle,
  rafThrottle,
  debounce,
  // DOM 유틸리티
  isInsideGallery,
  safeElementCheck,
} from './utils';

// 핵심 타입들
export type {
  BaseComponentProps,
  GalleryTheme,
  ImageFitMode,
  MediaInfo,
  Result,
  MediaType,
  ToastType,
  ViewMode,
} from './types';
