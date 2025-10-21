/**
 * @fileoverview 통합 상수 파일
 */

export const APP_CONFIG = {
  VERSION: '3.1.0',
  NAME: 'X.com Enhanced Gallery',
  MAX_MEDIA_ITEMS: 100,
  ANIMATION_DURATION: 'var(--xeg-duration-normal)',
} as const;

export const TIMING = {
  DEBOUNCE_DELAY: 100,
  CLICK_TIMEOUT: 5000,
  LOAD_TIMEOUT: 30000,
  URL_CLEANUP_DELAY: 100,
  CACHE_CLEANUP_INTERVAL: 60 * 1000,
} as const;

export const SELECTORS = {
  TWEET: 'article[data-testid="tweet"]',
  TWEET_PHOTO: '[data-testid="tweetPhoto"]',
  VIDEO_PLAYER: '[data-testid="videoPlayer"]',
  GALLERY_OVERLAY: '.xeg-gallery-overlay',
  GALLERY_CONTAINER: '.xeg-gallery-container',
} as const;

// 미디어 관련 상수
export const MEDIA = {
  DOMAINS: ['pbs.twimg.com', 'video.twimg.com', 'abs.twimg.com'] as const,
  TYPES: {
    IMAGE: 'image',
    VIDEO: 'video',
    GIF: 'gif',
  } as const,
  EXTENSIONS: {
    JPEG: 'jpg',
    PNG: 'png',
    WEBP: 'webp',
    GIF: 'gif',
    MP4: 'mp4',
    ZIP: 'zip',
  } as const,

  /** 미디어 품질 */
  QUALITY: {
    ORIGINAL: 'orig',
    LARGE: 'large',
    MEDIUM: 'medium',
    SMALL: 'small',
  } as const,
} as const;

// URL 패턴 (단일 소스 재노출)
import { URL_PATTERNS as SHARED_URL_PATTERNS } from './shared/utils/patterns/url-patterns';
export const URL_PATTERNS = SHARED_URL_PATTERNS;

// CSS 클래스 및 스타일
export const CSS = {
  CLASSES: {
    GALLERY_CONTAINER: 'xeg-gallery-container',
    OVERLAY: 'xeg-overlay',
    MEDIA_CONTAINER: 'xeg-media-container',
    TOOLBAR: 'xeg-toolbar',
    BUTTON: 'xeg-button',
  } as const,
  Z_INDEX: {
    GALLERY: 'var(--xeg-z-gallery)',
    MODAL: 'var(--xeg-z-modal)',
    TOOLBAR: 'var(--xeg-z-toolbar)',
    TOAST: 'var(--xeg-z-toast)',
  } as const,
  SPACING: {
    XS: 'var(--xeg-spacing-xs)',
    SM: 'var(--xeg-spacing-sm)',
    MD: 'var(--xeg-spacing-md)',
    LG: 'var(--xeg-spacing-lg)',
    XL: 'var(--xeg-spacing-xl)',
    XXL: 'var(--xeg-spacing-2xl)',
  } as const,
} as const;

export const HOTKEYS = {
  OPEN: 'Enter',
  CLOSE: 'Escape',
} as const;

export const EVENTS = {
  GALLERY_OPEN: 'xeg:gallery:open',
  GALLERY_CLOSE: 'xeg:gallery:close',
  MEDIA_CLICK: 'xeg:media:click',
  DOWNLOAD_START: 'xeg:download:start',
  DOWNLOAD_COMPLETE: 'xeg:download:complete',
  DOWNLOAD_ERROR: 'xeg:download:error',
} as const;

// 안정적인 DOM 선택자 (Fallback 전략)
export const STABLE_SELECTORS = {
  TWEET_CONTAINERS: [
    'article[data-testid="tweet"]',
    'article[role="article"]',
    'div[data-testid="tweet"]',
    'article',
  ],
  MEDIA_CONTAINERS: [
    '[data-testid="tweetPhoto"]',
    '[data-testid="videoPlayer"]',
    '[aria-label*="Image"]',
    '[aria-label*="Video"]',
  ],
  VIDEO_CONTAINERS: [
    '[data-testid="videoPlayer"]',
    '[data-testid="tweetVideo"]',
    '[data-testid="tweetPhoto"]',
    'video',
    '.media-container video',
    '[role="button"][aria-label*="video"]',
  ],

  IMAGE_CONTAINERS: [
    '[data-testid="tweetPhoto"]',
    'img[src*="pbs.twimg.com"]',
    'img[src*="twimg.com"]',
    'a[href*="/photo/"]',
    '.media-container img',
    '[role="img"]',
  ],
  MEDIA_LINKS: [
    'a[href*="/status/"][href*="/photo/"]',
    'a[href*="/status/"][href*="/video/"]',
    'a[data-testid="tweetPhoto"]',
  ],
  MEDIA_VIEWERS: [
    '[data-testid="photoViewer"]',
    '[data-testid="videoComponent"]',
    '[data-testid="media-overlay"]',
    '[data-testid="playButton"]',
    '[aria-modal="true"][data-testid="Drawer"]',
    '[data-testid="swipe-to-dismiss"]',
    '[data-testid="Drawer"] [role="button"]',
  ],
  MEDIA_PLAYERS: ['[data-testid="videoPlayer"]', 'video', '[role="button"][aria-label*="video"]'],
  ACTION_BUTTONS: {
    like: '[data-testid="like"]',
    retweet: '[data-testid="retweet"]',
    reply: '[data-testid="reply"]',
    share: '[data-testid="share"]',
    bookmark: '[data-testid="bookmark"]',
  },
} as const;

export const SERVICE_KEYS = {
  MEDIA_SERVICE: 'media.service',
  BULK_DOWNLOAD: 'core.bulkDownload',
  GALLERY: 'gallery',
  GALLERY_RENDERER: 'gallery.renderer',
  GALLERY_DOWNLOAD: 'gallery.download',
  MEDIA_EXTRACTION: 'media.extraction',
  MEDIA_FILENAME: 'media.filename',
  THEME: 'theme.auto',
  TOAST: 'toast.controller',
  SETTINGS: 'settings.manager',
  TWITTER_TOKEN_EXTRACTOR: 'settings.tokenExtractor',
  VIDEO_STATE: 'video.state',
  VIDEO_CONTROL: 'video.control',
  // Phase A5.2: BaseService 키
  ANIMATION: 'animation.service',
  LANGUAGE: 'language.service',
} as const;

export const TWITTER_API_CONFIG = {
  /** Guest/Suspended account Bearer token */
  GUEST_AUTHORIZATION:
    'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
  /** 트윗 결과 조회 쿼리 ID */
  TWEET_RESULT_BY_REST_ID_QUERY_ID: 'zAz9764BcLZOJ0JU2wrd1A',
  /** 사용자 정보 조회 쿼리 ID */
  USER_BY_SCREEN_NAME_QUERY_ID: '1VOOyvKkiI3FMmkeDNxM9A',
} as const;

// ================================
// 비디오 제어 요소 선택자
// ================================

export const VIDEO_CONTROL_SELECTORS = [
  '[data-testid="playButton"]',
  '[data-testid="pauseButton"]',
  '[data-testid="muteButton"]',
  '[data-testid="unmuteButton"]',
  // 'video' 제거 - 너무 포괄적
  '.video-controls button',
  '.video-progress button',
  'video::-webkit-media-controls-play-button',
  'video::-webkit-media-controls-mute-button',
] as const;

// ================================
// 시스템 페이지 목록
// ================================

export const SYSTEM_PAGES = [
  'home',
  'explore',
  'notifications',
  'messages',
  'bookmarks',
  'lists',
  'profile',
  'settings',
  'help',
  'search',
  'login',
  'signup',
] as const;

// ================================
// 유틸리티 함수
// ================================
// NOTE: 대부분의 유틸리티 함수는 shared/utils로 이동되었습니다.
// 남은 함수들도 점진적으로 이동 예정입니다.

// ================================
// 뷰 모드 상수
// ================================

/** 갤러리 뷰 모드 - 수직 갤러리만 지원 */
export const VIEW_MODES = ['verticalList'] as const;

// ================================
// 설정 기본값
// ================================

export const DEFAULT_SETTINGS = {
  gallery: {
    autoScrollSpeed: 5,
    infiniteScroll: true,
    preloadCount: 3,
    imageFitMode: 'fitWidth' as const,
    theme: 'auto' as const,
    animations: true,
    enableKeyboardNav: false,
  },
  download: {
    filenamePattern: 'original' as const,
    imageQuality: 'original' as const,
    maxConcurrentDownloads: 3,
    autoZip: false,
    folderStructure: 'flat' as const,
  },
  tokens: {
    autoRefresh: true,
    expirationMinutes: 60,
  },
  performance: {
    domCaching: true,
    cacheTTL: 3000,
    memoryMonitoring: true,
    performanceLogging: false,
    debugMode: false,
  },
  accessibility: {
    highContrast: false,
    reduceMotion: false,
    screenReaderSupport: true,
    focusIndicators: true,
  },
  version: '1.0.0',
  lastModified: Date.now(),
} as const;

// ================================
// 미디어 추출 기본 옵션
// ================================

export const DEFAULT_EXTRACTION_OPTIONS = {
  enableBackgroundLoading: true,
  enableCache: true,
  maxRetries: 3,
  timeout: 10000,
  fallbackStrategies: true,
  debugMode: false,
} as const;

// ================================
// 타입 정의
// ================================

export type MediaType = (typeof MEDIA.TYPES)[keyof typeof MEDIA.TYPES];
export type MediaQuality = (typeof MEDIA.QUALITY)[keyof typeof MEDIA.QUALITY];
export type FileExtension = (typeof MEDIA.EXTENSIONS)[keyof typeof MEDIA.EXTENSIONS];
export type AppServiceKey = (typeof SERVICE_KEYS)[keyof typeof SERVICE_KEYS];
export type EventType = (typeof EVENTS)[keyof typeof EVENTS];
export type ViewMode = (typeof VIEW_MODES)[number];
