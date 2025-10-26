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

// 최적화 컴포넌트들 제거됨 (기본 Preact memo 사용 권장)
// export * from './components/optimization';

// 서비스들 (기존 Core에서 이동)
export * from './services';

// 상태 관리 (기존 Core에서 이동)
export * from './state';

// 로깅 시스템 (기존 Core에서 이동)
export * from './logging';

// 메모리 관리 모듈 제거됨 (Phase 140.2 - 미사용 코드 정리)
// export * from './memory';

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

// 새로운 P4-P7 유틸리티들
export {
  createSelector,
  useSelector,
  useCombinedSelector,
  useAsyncSelector,
  getGlobalSelectorStats,
  clearGlobalSelectorStats,
} from './utils/signal-selector';
export { createFocusTrap } from './utils/focus-trap';
export type { FocusTrapOptions, FocusTrap } from './utils/focus-trap';
export {
  getToolbarDataState,
  getToolbarClassName,
  type ToolbarDataState,
} from './utils/toolbar-utils';

// 새로운 P4-P7 훅들
// NOTE: useGalleryToolbarLogic 제거 (Phase 140.2 미사용 코드 정리, 2025-10-26)
export { useFocusTrap } from './hooks/use-focus-trap';

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
