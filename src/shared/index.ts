/**
 * @fileoverview Shared Layer Exports
 * @version 6.0.0 - Phase 6: Solid.js 전용
 * @description 모든 공통 기능을 통합한 Shared 레이어 (Solid.js only)
 */

// 핵심 UI 컴포넌트들
export * from './components/ui';

// 격리 컴포넌트들 (갤러리 전용)
export * from './components/isolation';

// HOC 컴포넌트들 제거됨 (Solid.js는 HOC 패턴 사용 안 함)
// export * from './components/hoc';

// 최적화 컴포넌트들 제거됨 (기본 Preact memo 사용 권장)
// export * from './components/optimization';

// 서비스들 (기존 Core에서 이동)
export * from './services';

// 상태 관리 (기존 Core에서 이동)
export * from './state';

// 로깅 시스템 (기존 Core에서 이동)
export * from './logging';

// 메모리 관리 (기존 Core에서 이동)
export * from './memory';

// 핵심 유틸리티들 (주요 기능만)
export {
  // 접근성 & DOM 유틸리티
  detectLightBackground,
  getRelativeLuminance,
  parseColor,
  imageFilter,
  extractTweetInfoFromUrl,
  rafThrottle,
  throttleScroll,
  createDebouncer,
  safeElementCheck,
  canTriggerGallery,
  isGalleryInternalElement,
  isGalleryContainer,
} from './utils';

export { isInsideGallery } from './utils/dom';

// 최적화 유틸리티들 (Phase 3)
export * from './utils/optimization';

// 새로운 P4-P7 유틸리티들 (Phase 6: Solid.js)
export {
  createSelector,
  createCombinedSelector,
  setDebugMode as setSignalDebugMode,
} from './utils/signalSelector';
export { createFocusTrap } from './utils/focusTrap';
export type { FocusTrapOptions, FocusTrap } from './utils/focusTrap';

// Hooks 제거됨 (Solid.js primitives 사용)
// - useScrollLock → Solid primitives
// - useGalleryToolbarLogic → Solid primitives
// - useFocusTrap → Solid primitives

// 새로운 P6 스타일 토큰들
export * from './styles/tokens';

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
