/**
 * @fileoverview 미디어 처리 관련 상수 정의
 *
 * X.com Enhanced Gallery에서 사용되는 미디어 처리, 다운로드, 파일 관련 상수들을 정의합니다.
 */

/** 미디어 타입 */
export const MEDIA_TYPES = {
  /** 이미지 */
  IMAGE: 'image',
  /** 비디오 */
  VIDEO: 'video',
  /** GIF */
  GIF: 'gif',
} as const;

/** 미디어 품질 옵션 */
export const MEDIA_QUALITY = {
  /** 원본 */
  ORIGINAL: 'orig',
  /** 대형 */
  LARGE: 'large',
  /** 중형 */
  MEDIUM: 'medium',
  /** 소형 */
  SMALL: 'small',
  /** 썸네일 */
  THUMB: 'thumb',
} as const;

/** 파일 확장자 */
export const FILE_EXTENSIONS = {
  /** JPEG 이미지 */
  JPEG: 'jpg',
  /** PNG 이미지 */
  PNG: 'png',
  /** WebP 이미지 */
  WEBP: 'webp',
  /** GIF 이미지 */
  GIF: 'gif',
  /** MP4 비디오 */
  MP4: 'mp4',
  /** WebM 비디오 */
  WEBM: 'webm',
  /** ZIP 아카이브 */
  ZIP: 'zip',
} as const;

/** 다운로드 상태 */
export const DOWNLOAD_STATUS = {
  /** 대기 중 */
  PENDING: 'pending',
  /** 진행 중 */
  IN_PROGRESS: 'in_progress',
  /** 완료 */
  COMPLETED: 'completed',
  /** 실패 */
  FAILED: 'failed',
  /** 취소됨 */
  CANCELLED: 'cancelled',
} as const;

/** 미디어 처리 설정 */
export const MEDIA_CONFIG = {
  /** 기본 이미지 포맷 */
  DEFAULT_FORMAT: 'jpg',
  /** 기본 이미지 크기 */
  DEFAULT_SIZE: 'orig',
  /** 기본 비디오 품질 */
  DEFAULT_VIDEO_QUALITY: 'high',
  /** URL 처리 캐시 크기 제한 */
  CACHE_MAX_SIZE: 500,
  /** WebP 최적화 타임아웃 */
  WEBP_TIMEOUT: 2000,
  /** 미디어 로딩 타임아웃 (ms) */
  LOAD_TIMEOUT: 30000,
} as const;

/** URL 정리 딜레이 상수 */
export const URL_CLEANUP_DELAY = 100;

/** 트위터 API 관련 상수 */
export const TWITTER_API_CONFIG = {
  /** Guest/Suspended account Bearer token (Twitter Click'n'Save에서 가져옴) */
  GUEST_AUTHORIZATION:
    'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
  /** 트윗 결과 조회 쿼리 ID */
  TWEET_RESULT_BY_REST_ID_QUERY_ID: 'zAz9764BcLZOJ0JU2wrd1A',
  /** 사용자 정보 조회 쿼리 ID */
  USER_BY_SCREEN_NAME_QUERY_ID: '1VOOyvKkiI3FMmkeDNxM9A',
} as const;

/** 백그라운드 추출 관련 상수 (제거 예정) */
export const BACKGROUND_EXTRACTION = {
  /** 백그라운드 추출 비활성화 (간소화) */
  ENABLED: false,
  /** 자동 감지 비활성화 (간소화) */
  AUTO_DETECT_ENABLED: false,
  /** 타임아웃 (간소화된 값) */
  TIMEOUT: 5000,
  /** 기본 타임아웃 (간소화된 값) */
  DEFAULT_TIMEOUT: 5000,
  /** 최대 재시도 횟수 (간소화) */
  MAX_RETRIES: 1,
  /** 재시도 딜레이 (간소화) */
  RETRY_DELAY: 500,
} as const;

/** 시스템 페이지 목록 (사용자명으로 인식하지 않을 페이지들) */
export const SYSTEM_PAGES = [
  'home',
  'explore',
  'notifications',
  'messages',
  'bookmarks',
  'lists',
  'profile',
  'more',
  'compose',
  'search',
  'settings',
  'help',
  'display',
  'keyboard_shortcuts',
  'accessibility',
  'ads',
  'your_twitter_data',
  'privacy_and_safety',
  'personalization_and_data',
  'content_preferences',
  'moments',
  'twitter_for_websites',
  'privacy',
  'tos',
  'rules',
  'cookie_policy',
  'brand',
  'blog',
  'status',
  'about',
  'careers',
  'developers',
  'directory',
  'advertise',
  'marketing',
  'business',
  'media',
  'safety',
  'goto',
  'login',
  'logout',
  'signup',
  'download',
  'intent',
  'i', // API 경로
  'topics',
  'account',
] as const;

/** 미디어 추출 관련 상수 */
export const MEDIA_EXTRACTION = {
  STRATEGIES: {
    API_FIRST: 'api-first',
    DOM_FALLBACK: 'dom-fallback',
    FALLBACK: 'fallback',
  },
  PRIORITIES: {
    API_FIRST: 100,
    DOM_FALLBACK: 50,
    FALLBACK: 10,
  },
  TIMEOUTS: {
    EXTRACTION: 15000,
    API_REQUEST: 10000,
    DOM_SEARCH: 5000,
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY_MS: 1000,
  },
} as const;

/** 추출 소스 타입 */
export const EXTRACTION_SOURCES = {
  API_FIRST: 'api-first',
  DOM_FALLBACK: 'dom-fallback',
  FAILED: 'failed',
  ERROR: 'error',
} as const;

/** 타입 정의 */
// MediaType은 core/types/media.types.ts에서 정의됨 (중복 제거)
export type MediaQuality = (typeof MEDIA_QUALITY)[keyof typeof MEDIA_QUALITY];
export type FileExtension = (typeof FILE_EXTENSIONS)[keyof typeof FILE_EXTENSIONS];
export type DownloadStatus = (typeof DOWNLOAD_STATUS)[keyof typeof DOWNLOAD_STATUS];
export type ExtractionStrategyPriority = string;
