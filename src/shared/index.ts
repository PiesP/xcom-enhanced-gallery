/**
 * @fileoverview Shared Layer Exports
 * @version 3.0.0 - Phase 4: Core 통합 완료
 * @description 모든 공통 기능을 통합한 Shared 레이어
 */

// 핵심 UI 컴포넌트들
export * from './components/ui';

// 격리 컴포넌트들 (갤러리 전용)
export * from './components/isolation';

// HOC 컴포넌트들
export * from './components/hoc';

// 서비스들 (기존 Core에서 이동)
export * from './services';

// 상태 관리 (기존 Core에서 이동)
export * from './state';

// 로깅 시스템 (기존 Core에서 이동)
export * from './logging';

// 관리자들 (기존 Core에서 이동)
export * from './managers';

// 메모리 관리 (기존 Core에서 이동)
export * from './memory';

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
  imageFilter,
  extractTweetInfoFromUrl,
  rafThrottle,
  throttleScroll,
  createDebouncer,
  safeElementCheck,
} from './utils';

export { GalleryUtils } from './utils/gallery-utils';
export { isInsideGallery } from './utils/dom-utils';

// 타입들
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
