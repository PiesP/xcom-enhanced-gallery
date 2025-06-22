/**
 * @fileoverview 갤러리 UI 관련 상수 정의
 *
 * X.com Enhanced Gallery에서 사용되는 갤러리 UI, 상호작용, 키보드 단축키 관련 상수들을 정의합니다.
 * 파일명을 UPPER_SNAKE_CASE로 하여 상수 파일임을 명확히 표시합니다.
 */

/** 갤러리 설정 상수 */
export const GALLERY_CONFIG = {
  /** 최대 미디어 아이템 수 */
  MAX_MEDIA_ITEMS: 100,
  /** 기본 뷰 모드 */
  DEFAULT_VIEW_MODE: 'verticalList' as const,
  /** 애니메이션 지속 시간 (ms) */
  ANIMATION_DURATION: 300,
  /** 키보드 네비게이션 딜레이 (ms) */
  KEYBOARD_DELAY: 150,
  /** 썸네일 최대 크기 (px) */
  THUMBNAIL_MAX_SIZE: 200,
} as const;

/** 갤러리 CSS 선택자 */
export const GALLERY_SELECTORS = {
  /** 트위터 미디어 컨테이너 */
  TWEET_PHOTO: '[data-testid="tweetPhoto"]',
  /** 트위터 미디어 그룹 */
  TWEET_MEDIA_GROUP: '[data-testid="tweetMedia"]',
  /** 갤러리 오버레이 */
  GALLERY_OVERLAY: '.xeg-gallery-overlay',
  /** 미디어 컨테이너 */
  MEDIA_CONTAINER: '.xeg-media-container',
  /** 툴바 컨테이너 */
  TOOLBAR_CONTAINER: '.xeg-toolbar-container',
  /** 네비게이션 버튼 */
  NAV_BUTTON: '.xeg-nav-button',
} as const;

/** Z-index 상수 (CSS 변수와 일치) */
export const XEG_Z_INDEX = {
  /** 갤러리 기본 레이어 */
  GALLERY: 9999,
  /** 모달 */
  MODAL: 10000,
  /** 툴바 */
  TOOLBAR: 10001,
  /** 툴팁 */
  TOOLTIP: 10001,
  /** 토스트 알림 */
  TOAST: 10080,
} as const;

/** 갤러리 키보드 단축키 */
export const XEG_HOTKEYS = {
  /** 갤러리 열기 */
  OPEN: 'Enter',
  /** 갤러리 닫기 */
  CLOSE: 'Escape',
  /** 이전 미디어 */
  PREVIOUS: 'ArrowLeft',
  /** 다음 미디어 */
  NEXT: 'ArrowRight',
  /** 첫 번째 미디어 */
  FIRST: 'Home',
  /** 마지막 미디어 */
  LAST: 'End',
  /** 현재 미디어 다운로드 */
  DOWNLOAD_CURRENT: 'd',
  /** 모든 미디어 다운로드 */
  DOWNLOAD_ALL: 'D',
  /** 설정 열기 */
  SETTINGS: 's',
  /** 풀스크린 토글 */
  FULLSCREEN: 'f',
} as const;

/** 갤러리 뷰 모드 */
export const XEG_VIEW_MODES = {
  /** 세로 목록 */
  VERTICAL_LIST: 'verticalList',
  /** 그리드 */
  GRID: 'grid',
  /** 수평 목록 */
  HORIZONTAL_LIST: 'horizontalList',
} as const;

/** 갤러리 상태 */
export const XEG_STATES = {
  /** 닫힘 */
  CLOSED: 'closed',
  /** 열림 */
  OPEN: 'open',
  /** 로딩 중 */
  LOADING: 'loading',
  /** 오류 */
  ERROR: 'error',
} as const;

/** 토스트 알림 타입 */
export const XEG_TOAST_TYPES = {
  /** 정보 */
  INFO: 'info',
  /** 성공 */
  SUCCESS: 'success',
  /** 경고 */
  WARNING: 'warning',
  /** 오류 */
  ERROR: 'error',
} as const;

/** 갤러리 이벤트 타입 */
export const XEG_EVENTS = {
  /** 갤러리 열림 */
  GALLERY_OPEN: 'gallery:open',
  /** 갤러리 닫힘 */
  GALLERY_CLOSE: 'gallery:close',
  /** 미디어 선택 */
  MEDIA_SELECT: 'media:select',
  /** 미디어 로드 */
  MEDIA_LOAD: 'media:load',
  /** 미디어 로드 실패 */
  MEDIA_ERROR: 'media:error',
  /** 다운로드 시작 */
  DOWNLOAD_START: 'download:start',
  /** 다운로드 완료 */
  DOWNLOAD_COMPLETE: 'download:complete',
  /** 다운로드 실패 */
  DOWNLOAD_ERROR: 'download:error',
} as const;

/** CSS 스페이싱 시스템 (8px 기반) */
export const XEG_SPACING = {
  /** 4px */
  XS: 4,
  /** 8px */
  SM: 8,
  /** 16px */
  MD: 16,
  /** 24px */
  LG: 24,
  /** 32px */
  XL: 32,
  /** 40px */
  XXL: 40,
  /** 48px */
  XXXL: 48,
} as const;

/** 컴포넌트 크기 상수 */
export const XEG_COMPONENT_SIZES = {
  /** 버튼 크기 */
  BUTTON: {
    SM: 32,
    MD: 40,
    LG: 48,
  },
  /** 아이콘 크기 */
  ICON: {
    SM: 16,
    MD: 20,
    LG: 24,
    XL: 32,
  },
} as const;

/** 타입 정의 */
export type ViewMode = (typeof XEG_VIEW_MODES)[keyof typeof XEG_VIEW_MODES];
export type GalleryState = (typeof XEG_STATES)[keyof typeof XEG_STATES];
export type ToastType = (typeof XEG_TOAST_TYPES)[keyof typeof XEG_TOAST_TYPES];
export type GalleryEvent = (typeof XEG_EVENTS)[keyof typeof XEG_EVENTS];

// End of file
