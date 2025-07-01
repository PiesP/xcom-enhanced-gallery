/**
 * 갤러리 상태 관리 통합 Export
 * @version 2.0.0 - Clean Architecture
 */

// 메인 통합 Signal (권장)
export {
  // 상태 접근자
  galleryState,

  // 액션 함수들
  openGallery,
  closeGallery,
  navigateToMedia,
  navigatePrevious,
  navigateNext,
  setLoading,
  setError,
  setViewMode,

  // 선택자 함수들
  getCurrentMedia,
  getGalleryInfo,

  // 이벤트 시스템
  addEventListener,

  // 타입들
  type UnifiedGalleryState,
  type GalleryEvents,
} from './unified-gallery.signals';

// 하위 호환성을 위한 별칭들
export {
  navigateToMedia as selectMediaItem,
  getCurrentMedia as getCurrentMediaItem,
  setLoading as setGalleryLoading,
} from './unified-gallery.signals';

// 다운로드 상태 관리
export * from './download.signals';

// 타입 별칭들 (호환성)
export type { UnifiedGalleryState as GalleryState } from './unified-gallery.signals';
