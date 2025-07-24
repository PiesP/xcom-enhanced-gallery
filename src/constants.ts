/**
 * @fileoverview 통합 상수 파일
 * @description X.com Enhanced Gallery에서 사용되는 모든 상수들을 통합 관리
 * @version 1.0.0 - Simplified Structure
 */

// ================================
// 애플리케이션 기본 설정
// ================================

export const APP_CONFIG = {
  /** 애플리케이션 버전 */
  VERSION: '3.1.0',
  /** 애플리케이션 이름 */
  NAME: 'X.com Enhanced Gallery',
  /** 최대 미디어 아이템 수 */
  MAX_MEDIA_ITEMS: 100,
  /** 애니메이션 지속 시간 (ms) */
  ANIMATION_DURATION: 300,
} as const;

// ================================
// 타이밍 및 성능 상수
// ================================

export const TIMING = {
  /** 디바운싱 지연 시간 (ms) */
  DEBOUNCE_DELAY: 100,
  /** 클릭 처리 타임아웃 (ms) */
  CLICK_TIMEOUT: 5000,
  /** 미디어 로딩 타임아웃 (ms) */
  LOAD_TIMEOUT: 30000,
  /** URL 정리 딜레이 (ms) */
  URL_CLEANUP_DELAY: 100,
  /** 캐시 정리 간격 (ms) */
  CACHE_CLEANUP_INTERVAL: 60 * 1000,
} as const;

// ================================
// DOM 선택자
// ================================

export const SELECTORS = {
  /** 트윗 컨테이너 */
  TWEET: 'article[data-testid="tweet"]',
  /** 미디어 컨테이너 */
  TWEET_PHOTO: '[data-testid="tweetPhoto"]',
  /** 비디오 플레이어 */
  VIDEO_PLAYER: '[data-testid="videoPlayer"]',
  /** 갤러리 오버레이 */
  GALLERY_OVERLAY: '.xeg-gallery-overlay',
  /** 갤러리 컨테이너 */
  GALLERY_CONTAINER: '.xeg-gallery-container',
} as const;

// ================================
// 미디어 관련 상수
// ================================

export const MEDIA = {
  /** 지원 도메인 */
  DOMAINS: ['pbs.twimg.com', 'video.twimg.com', 'abs.twimg.com'] as const,

  /** 미디어 타입 */
  TYPES: {
    IMAGE: 'image',
    VIDEO: 'video',
    GIF: 'gif',
  } as const,

  /** 파일 확장자 */
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

// ================================
// URL 패턴
// ================================

export const URL_PATTERNS = {
  /** 미디어 URL 패턴 */
  MEDIA:
    /^https:\/\/pbs\.twimg\.com\/(?:media\/[\w-]+\?format=(?:jpg|jpeg|png|webp)&name=(?:[a-z]+|\d{2,4}x\d{2,4})|[\w-]+_video_thumb\/\d+\/img\/[\w-]+(?:\?.*)?)/,

  /** 갤러리용 미디어 패턴 */
  GALLERY_MEDIA:
    /^https:\/\/pbs\.twimg\.com\/(?:media\/[\w-]+\?format=(?:jpg|jpeg|png|webp)&name=orig|[\w-]+_video_thumb\/\d+\/img\/[\w-]+(?:\?.*)?)/,

  /** 미디어 ID 추출 */
  MEDIA_ID: /\/media\/([\w-]+)\?/,

  /** 동영상 썸네일 ID 추출 */
  VIDEO_THUMB_ID: /\/([\w-]+_video_thumb)\/(\d+)\/img\/([\w-]+)/,

  /** 트윗 ID 추출 */
  TWEET_ID: /https?:\/\/(?:twitter\.com|x\.com)\/([^/]+)\/status\/(\d+)/,
} as const;

// ================================
// CSS 클래스 및 스타일
// ================================

export const CSS = {
  /** CSS 클래스 */
  CLASSES: {
    GALLERY_CONTAINER: 'xeg-gallery-container',
    OVERLAY: 'xeg-overlay',
    MEDIA_CONTAINER: 'xeg-media-container',
    TOOLBAR: 'xeg-toolbar',
    BUTTON: 'xeg-button',
  } as const,

  /** Z-index 값 */
  Z_INDEX: {
    GALLERY: 9999,
    MODAL: 10000,
    TOOLBAR: 10001,
    TOAST: 10080,
  } as const,

  /** 스페이싱 (8px 기반) */
  SPACING: {
    XS: 4,
    SM: 8,
    MD: 16,
    LG: 24,
    XL: 32,
    XXL: 40,
  } as const,
} as const;

// ================================
// 키보드 단축키
// ================================

export const HOTKEYS = {
  /** 갤러리 열기 */
  OPEN: 'Enter',
  /** 갤러리 닫기 */
  CLOSE: 'Escape',
} as const;

// ================================
// 이벤트 타입
// ================================

export const EVENTS = {
  GALLERY_OPEN: 'xeg:gallery:open',
  GALLERY_CLOSE: 'xeg:gallery:close',
  MEDIA_CLICK: 'xeg:media:click',
  DOWNLOAD_START: 'xeg:download:start',
  DOWNLOAD_COMPLETE: 'xeg:download:complete',
  DOWNLOAD_ERROR: 'xeg:download:error',
} as const;

// ================================
// 안정적인 DOM 선택자 (Fallback 전략)
// ================================

export const STABLE_SELECTORS = {
  /** 트윗 컨테이너 선택자 (우선순위 순) */
  TWEET_CONTAINERS: [
    'article[data-testid="tweet"]', // 표준 트윗 - 가장 안정적
    'article[role="article"]', // 접근성 기반 fallback
    'div[data-testid="tweet"]', // 임베드된 트윗
    'article', // 구조적 fallback
  ],

  /** 미디어 컨테이너 선택자 */
  MEDIA_CONTAINERS: [
    '[data-testid="tweetPhoto"]', // 트윗 이미지 컨테이너
    '[data-testid="videoPlayer"]', // 비디오 플레이어 컨테이너
    '[data-testid="tweetVideo"]', // 트윗 내 비디오
    '.media-container', // 일반 미디어 컨테이너
    '[role="img"]', // 접근성 기반 이미지
  ],

  /** 미디어 플레이어 선택자 */
  MEDIA_PLAYERS: [
    '[data-testid="videoPlayer"]', // 비디오 플레이어 - 최우선
    '[data-testid="tweetVideo"]', // 트윗 내 비디오
    '[data-testid="tweetPhoto"]', // 트윗 내 이미지
    'video', // 표준 비디오 태그
    '.media-container video', // 컨테이너 내 비디오
    '[role="button"][aria-label*="video"]', // 접근성 기반 비디오 버튼
  ],

  /** 이미지 컨테이너 선택자 */
  IMAGE_CONTAINERS: [
    '[data-testid="tweetPhoto"]', // 트윗 이미지 - 최우선
    'a[href*="/photo/"]', // 이미지 링크
    'img[src*="pbs.twimg.com"]', // 트위터 CDN 이미지
    'img[src*="twimg.com"]', // 레거시 CDN 도메인
    '.media-container img', // 컨테이너 내 이미지
    '[role="img"]', // 접근성 기반 이미지
  ],

  /** 미디어 링크 선택자 */
  MEDIA_LINKS: [
    'a[href*="/status/"][href*="/photo/"]', // 이미지 상세 링크
    'a[href*="/status/"][href*="/video/"]', // 비디오 상세 링크
    'a[data-testid="tweetPhoto"]', // 테스트 ID 기반 링크
  ],

  /** 액션 버튼 선택자 */
  ACTION_BUTTONS: {
    like: '[data-testid="like"]',
    retweet: '[data-testid="retweet"]',
    reply: '[data-testid="reply"]',
    share: '[data-testid="share"]',
    bookmark: '[data-testid="bookmark"]',
  },
} as const;

// ================================
// 서비스 키
// ================================

export const SERVICE_KEYS = {
  // Phase 2: 통합된 서비스들
  MEDIA_SERVICE: 'media.service', // 통합 미디어 서비스
  UI_SERVICE: 'ui.service', // 통합 UI 서비스

  // 기존 서비스들 (호환성 유지)
  BULK_DOWNLOAD: 'core.bulkDownload',
  GALLERY: 'gallery',
  GALLERY_RENDERER: 'gallery.renderer',
  GALLERY_DOWNLOAD: 'gallery.download',
  MEDIA_EXTRACTION: 'media.extraction',
  MEDIA_FILENAME: 'media.filename',
  AUTO_THEME: 'theme.auto',
  THEME: 'theme.auto',
  TOAST_CONTROLLER: 'toast.controller',
  TOAST: 'toast.controller',
  SETTINGS_MANAGER: 'settings.manager',
  SETTINGS: 'settings.manager',
  TWITTER_TOKEN_EXTRACTOR: 'settings.tokenExtractor',
  VIDEO_STATE: 'video.state',
  VIDEO_CONTROL: 'video.control',
} as const;

// ================================
// API 설정
// ================================

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

/**
 * 미디어 URL이 유효한지 확인
 */
export function isValidMediaUrl(url: string): boolean {
  return URL_PATTERNS.MEDIA.test(url);
}

/**
 * 갤러리용 미디어 URL인지 확인
 */
export function isValidGalleryUrl(url: string): boolean {
  return URL_PATTERNS.GALLERY_MEDIA.test(url);
}

/**
 * 미디어 ID 추출
 */
export function extractMediaId(url: string): string | null {
  const match = url.match(URL_PATTERNS.MEDIA_ID);
  if (match?.[1]) return match[1];

  const videoMatch = url.match(URL_PATTERNS.VIDEO_THUMB_ID);
  if (videoMatch?.[3]) return videoMatch[3];

  return null;
}

/**
 * 원본 URL 생성
 */
export function generateOriginalUrl(url: string): string | null {
  const mediaId = extractMediaId(url);
  if (!mediaId) return null;

  const formatMatch = url.match(/[?&]format=([^&]+)/);
  const format = formatMatch?.[1] ?? 'jpg';

  return `https://pbs.twimg.com/media/${mediaId}?format=${format}&name=orig`;
}

/**
 * 비디오 제어 요소인지 확인
 */
export function isVideoControlElement(element: HTMLElement): boolean {
  return VIDEO_CONTROL_SELECTORS.some(selector => {
    try {
      return element.matches(selector) || element.closest(selector) !== null;
    } catch {
      return false;
    }
  });
}

/**
 * 트윗 ID 추출
 */
export function extractTweetId(url: string): string | null {
  const match = url.match(URL_PATTERNS.TWEET_ID);
  return match?.[2] ?? null;
}

// ================================
// 뷰 모드 상수
// ================================

/** 갤러리 뷰 모드 - 수직 갤러리만 지원 */
export const VIEW_MODES = ['verticalList'] as const;

/**
 * ViewMode 유효성 검사 함수
 */
export function isValidViewMode(mode: string): mode is ViewMode {
  return VIEW_MODES.includes(mode as ViewMode);
}

/**
 * ViewMode 변환 함수 (하위 호환성)
 */
export function normalizeViewMode(_mode: unknown): ViewMode {
  // 모든 모드를 수직 갤러리로 통일
  return 'verticalList';
}

// ================================
// 설정 기본값
// ================================

export const DEFAULT_SETTINGS = {
  gallery: {
    autoScrollSpeed: 5,
    infiniteScroll: true,
    preloadCount: 3,
    virtualScrolling: true,
    theme: 'auto' as const,
    animations: true,
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
