/**
 * @fileoverview 단순화된 설정 시스템
 * @description 유저스크립트에 적합한 간단한 설정 관리
 *
 * 변경사항:
 * - 복잡한 설정 관리자 제거
 * - 단순한 상수 기반 설정
 * - 동적 설정 변경 기능 제거 (유저스크립트에서는 불필요)
 * - 로컬 스토리지 의존성 제거
 */

/**
 * 갤러리 설정
 */
export const GALLERY_CONFIG = {
  // 애니메이션
  ANIMATION_DURATION: 300,
  TRANSITION_EASING: 'ease-in-out',

  // 이미지 로딩
  PRELOAD_IMAGES: true,
  MAX_CONCURRENT_LOADS: 3,
  IMAGE_LOAD_TIMEOUT: 10000,

  // 키보드 단축키
  KEYBOARD_ENABLED: true,
  SCROLL_SENSITIVITY: 1.2,

  // 줌
  MAX_ZOOM_LEVEL: 5,
  MIN_ZOOM_LEVEL: 0.1,
  ZOOM_STEP: 0.2,
} as const;

/**
 * 미디어 처리 설정
 */
export const MEDIA_CONFIG = {
  // 지원 형식
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  SUPPORTED_VIDEO_TYPES: ['video/mp4', 'video/webm'],

  // 재시도 설정
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,

  // 파일 크기 제한
  MAX_FILE_SIZE_MB: 100,

  // URL 패턴
  TWITTER_IMAGE_URL_PATTERN: /https:\/\/pbs\.twimg\.com\/media\/[^?]+/,
  TWITTER_VIDEO_URL_PATTERN: /https:\/\/video\.twimg\.com\/[^?]+/,
} as const;

/**
 * 다운로드 설정
 */
export const DOWNLOAD_CONFIG = {
  // 파일명 설정
  DEFAULT_FILENAME_PATTERN: '{username}_{date}_{index}',
  DATE_FORMAT: 'YYYY-MM-DD',

  // 압축 설정
  ENABLE_ZIP_COMPRESSION: true,
  ZIP_COMPRESSION_LEVEL: 6,

  // 동시 다운로드
  MAX_CONCURRENT_DOWNLOADS: 3,
  DOWNLOAD_TIMEOUT: 30000,
} as const;

/**
 * 성능 설정
 */
export const PERFORMANCE_CONFIG = {
  // 디바운스/스로틀
  SCROLL_DEBOUNCE_DELAY: 16, // ~60fps
  RESIZE_DEBOUNCE_DELAY: 100,
  CLICK_DEBOUNCE_DELAY: 300,

  // 메모리 관리
  MEMORY_WARNING_THRESHOLD_MB: 50,
  MEMORY_CRITICAL_THRESHOLD_MB: 100,
  AUTO_CLEANUP_ENABLED: true,

  // RAF 최적화
  USE_REQUEST_ANIMATION_FRAME: true,
  MAX_RAF_QUEUE_SIZE: 10,
} as const;

/**
 * UI 설정
 */
export const UI_CONFIG = {
  // Z-index 관리
  Z_INDEX: {
    GALLERY_BACKDROP: 9998,
    GALLERY_CONTAINER: 9999,
    TOOLBAR: 10000,
    TOAST: 10001,
  },

  // 색상 (CSS 변수명)
  COLORS: {
    PRIMARY: '--xeg-primary',
    SECONDARY: '--xeg-secondary',
    BACKGROUND: '--xeg-background',
    TEXT: '--xeg-text',
    BORDER: '--xeg-border',
  },

  // 크기
  SIZES: {
    TOOLBAR_HEIGHT: 60,
    THUMBNAIL_SIZE: 120,
    MIN_GALLERY_WIDTH: 800,
    MIN_GALLERY_HEIGHT: 600,
  },
} as const;

/**
 * 디버그 설정
 */
export const DEBUG_CONFIG = {
  ENABLED: typeof window !== 'undefined' && window.location.hostname === 'localhost',
  LOG_LEVEL: 'info' as 'debug' | 'info' | 'warn' | 'error',
  PERFORMANCE_MONITORING: true,
  MEMORY_MONITORING: true,
} as const;

/**
 * 통합 설정 객체
 */
export const CONFIG = {
  GALLERY: GALLERY_CONFIG,
  MEDIA: MEDIA_CONFIG,
  DOWNLOAD: DOWNLOAD_CONFIG,
  PERFORMANCE: PERFORMANCE_CONFIG,
  UI: UI_CONFIG,
  DEBUG: DEBUG_CONFIG,
} as const;

/**
 * 설정 타입
 */
export type AppConfig = typeof CONFIG;

/**
 * 편의 함수들
 */
export function getGalleryConfig() {
  return CONFIG.GALLERY;
}

export function getMediaConfig() {
  return CONFIG.MEDIA;
}

export function getDownloadConfig() {
  return CONFIG.DOWNLOAD;
}

export function getPerformanceConfig() {
  return CONFIG.PERFORMANCE;
}

export function getUIConfig() {
  return CONFIG.UI;
}

export function getDebugConfig() {
  return CONFIG.DEBUG;
}

/**
 * 환경별 설정 오버라이드
 */
export function createRuntimeConfig(): AppConfig {
  const isDevelopment =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname.includes('dev'));

  if (isDevelopment) {
    return {
      ...CONFIG,
      DEBUG: {
        ...CONFIG.DEBUG,
        ENABLED: true,
        LOG_LEVEL: 'debug',
      },
      PERFORMANCE: {
        ...CONFIG.PERFORMANCE,
        AUTO_CLEANUP_ENABLED: false, // 개발 시 디버깅 용이성
      },
    };
  }

  return CONFIG;
}
