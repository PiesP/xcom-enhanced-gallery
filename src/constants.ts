/**
 * @fileoverview 통합 상수 파일
 */

// extractMediaId, URL_PATTERNS 등은 @shared/constants/media.constants에서 import하여 사용
import {
  extractMediaId,
  URL_PATTERNS,
  isValidMediaUrl,
  isValidGalleryUrl,
  extractTweetId,
} from '@shared/constants/media.constants';

// re-export for backward compatibility
export { extractMediaId, URL_PATTERNS, isValidMediaUrl, isValidGalleryUrl, extractTweetId };

// 애플리케이션 기본 설정
export const APP_CONFIG = {
  VERSION: '3.1.0',
  NAME: 'X.com Enhanced Gallery',
  MAX_MEDIA_ITEMS: 100,
  ANIMATION_DURATION: 300,
} as const;

// 타이밍 및 성능 상수
export const TIMING = {
  DEBOUNCE_DELAY: 100,
  CLICK_TIMEOUT: 5000,
  LOAD_TIMEOUT: 30000,
  URL_CLEANUP_DELAY: 100,
  CACHE_CLEANUP_INTERVAL: 60 * 1000,
} as const;

// DOM 선택자
export const SELECTORS = {
  TWEET: 'article[data-testid="tweet"]',
  TWEET_PHOTO: '[data-testid="tweetPhoto"]',
  VIDEO_PLAYER: '[data-testid="videoPlayer"]',
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
  UI_SERVICE: 'ui.service', // UI 서비스

  // 기존 서비스들 (중복 제거)
  BULK_DOWNLOAD: 'core.bulkDownload',
  GALLERY: 'gallery',
  GALLERY_RENDERER: 'gallery.renderer',
  GALLERY_DOWNLOAD: 'gallery.download',
  MEDIA_EXTRACTION: 'media.extraction',
  MEDIA_FILENAME: 'media.filename',
  THEME: 'theme.auto', // AUTO_THEME 별칭 제거
  TOAST: 'toast.controller', // TOAST_CONTROLLER 별칭 제거
  SETTINGS: 'settings.manager', // SETTINGS_MANAGER 별칭 제거
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
 * 트위터 네이티브 갤러리 요소인지 확인 (중복 실행 방지용)
 */
export function isTwitterNativeGalleryElement(element: HTMLElement): boolean {
  // 우리의 갤러리 요소는 제외
  if (
    element.closest('.xeg-gallery-container') ||
    element.closest('[data-xeg-gallery]') ||
    element.classList.contains('xeg-gallery-item') ||
    element.classList.contains('xeg-gallery') ||
    element.closest('.xeg-gallery') ||
    element.hasAttribute('data-xeg-gallery-type')
  ) {
    return false;
  }

  // 트위터 네이티브 갤러리 트리거 요소들 (클릭 시 갤러리가 열리는 요소들)
  const twitterGalleryTriggerSelectors = [
    // 미디어 컨테이너들 - 클릭 시 갤러리가 열림
    '[data-testid="tweetPhoto"]',
    '[data-testid="tweetPhoto"] img',
    '[data-testid="tweetPhoto"] > div',
    '[data-testid="videoPlayer"]',
    '[data-testid="videoPlayer"] > *',

    // 미디어 링크들
    'a[href*="/photo/"]',
    'a[href*="/status/"][href*="/photo/"] *',
    'a[href*="/status/"][href*="/video/"] *',

    // 트위터 이미지/비디오 요소들
    'img[src*="pbs.twimg.com"]',
    'img[src*="twimg.com"]',
    'video[poster*="twimg.com"]',

    // 미디어 오버레이 및 플레이 버튼들
    '[data-testid="playButton"]',
    '[data-testid="videoComponent"]',
    'div[role="button"][aria-label*="재생"]',
    'div[role="button"][aria-label*="Play"]',
  ];

  // 이미 열린 트위터 갤러리 모달 요소들
  const twitterGalleryModalSelectors = [
    '[aria-modal="true"][data-testid="Drawer"]',
    '[data-testid="swipe-to-dismiss"]',
    '[data-testid="photoViewer"]',
    '[data-testid="media-overlay"]',
    '[data-testid="Drawer"] [role="button"]',
  ];

  const allSelectors = [...twitterGalleryTriggerSelectors, ...twitterGalleryModalSelectors];

  return allSelectors.some(selector => {
    try {
      return element.matches(selector) || element.closest(selector) !== null;
    } catch {
      return false;
    }
  });
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

// ================================
// Feature Flags
// ================================

export const FEATURE_BODY_SCROLL_LOCK: boolean = (() => {
  try {
    // vite define 로 주입된 process.env.FEATURE_BODY_SCROLL_LOCK 사용
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (process as any)?.env?.FEATURE_BODY_SCROLL_LOCK;
    if (raw === 'false') return false;
    return true;
  } catch {
    return true; // 안전 기본값
  }
})();

// ================================
// Planned Feature Flags (Phase 2+)
// ================================
// TDD Plan Phase 2~7에서 사용할 플래그 (기본값 안전 OFF/ON 정의)
export const FEATURE_VIRTUAL_SCROLL: boolean = (() => {
  try {
    // 테스트 및 런타임 강제 오버라이드 지원
    // (Vitest 또는 사용자 스크립트 재주입 환경에서 동적 토글 필요)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const forced = (globalThis as any)?.__XEG_FORCE_FLAGS__?.FEATURE_VIRTUAL_SCROLL;
    if (typeof forced === 'boolean') return forced;
    // vite define 또는 test 환경 process.env.FEATURE_VIRTUAL_SCROLL 사용
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (process as any)?.env?.FEATURE_VIRTUAL_SCROLL;
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return true; // Phase 2 완료로 기본값 ON 변경
  } catch {
    return true; // Phase 2 완료로 기본값 ON 변경
  }
})(); // Phase 2 완료됨
export const FEATURE_GALLERY_SHADOW: boolean = true; // Phase 4 완료됨
export const FEATURE_MEDIA_PRELOAD: boolean = true; // Phase 6 - 사전 로딩 기본 활성
export const FEATURE_MEDIA_UNLOAD: boolean = true; // Phase 7 - 오프스크린 언로딩
// Phase 13: GalleryController 통합 (초기 OFF - 통합 진행 중)
// Phase 13: GalleryController 통합 (기본값 ON – 안정화 완료)
export const FEATURE_GALLERY_CONTROLLER: boolean = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const forced = (globalThis as any)?.__XEG_FORCE_FLAGS__?.FEATURE_GALLERY_CONTROLLER;
    if (typeof forced === 'boolean') return forced;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (process as any)?.env?.FEATURE_GALLERY_CONTROLLER;
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return true; // 기본 ON (점진적 마이그레이션 1단계 완료)
  } catch {
    return true;
  }
})();
// Phase 14 Variant B: 조건부 preventDefault 전략 실험 (기본 OFF)
export const FEATURE_INERTIA_CONDITIONAL_PREVENT: boolean = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const forced = (globalThis as any)?.__XEG_FORCE_FLAGS__?.FEATURE_INERTIA_CONDITIONAL_PREVENT;
    if (typeof forced === 'boolean') return forced;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (process as any)?.env?.FEATURE_INERTIA_CONDITIONAL_PREVENT;
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return false;
  } catch {
    return false;
  }
})();

/**
 * Phase 14 Inertia Variant B 실험 플래그
 * 목적: 경계(Top/Bottom) overscroll 방향 delta 에 대해 preventDefault 를 해제하여
 *  트위터 기본 스크롤(배경)과의 관성 자연감을 비교 측정.
 * 차이점:
 *  - FEATURE_INERTIA_CONDITIONAL_PREVENT 는 조건부 차단 자체의 온/오프
 *  - 본 플래그는 Variant B 실험 자체 활성화 (실험 중 로깅/메트릭 분리 목적)
 * 동작:
 *  - OFF (기본): Variant A 유지 (항상 차단) 혹은 기존 conditional flag 만 영향
 *  - ON: inertia-experiment 모듈이 setInertiaExperimentVariant('B') 로 전환하도록 상위 오케스트레이션에서 사용
 * 강제 오버라이드: globalThis.__XEG_FORCE_FLAGS__.FEATURE_INERTIA_VARIANT_B = true/false
 * 환경변수: process.env.FEATURE_INERTIA_VARIANT_B = 'true' | 'false'
 */
export const FEATURE_INERTIA_VARIANT_B: boolean = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const forced = (globalThis as any)?.__XEG_FORCE_FLAGS__?.FEATURE_INERTIA_VARIANT_B;
    if (typeof forced === 'boolean') return forced;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (process as any)?.env?.FEATURE_INERTIA_VARIANT_B;
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return false; // 실험 기본 OFF
  } catch {
    return false;
  }
})();

/**
 * Store Selector Fast Path 플래그
 * 목적: selectors.isOpen() 호출을 직접 signal getter(isGalleryOpen) 로 alias 하여 호출 depth 감소
 * 사용처: 고빈도 wheel/event 게이트 경로에서 selector 경량화 실험
 * 강제 오버라이드: globalThis.__XEG_FORCE_FLAGS__.FEATURE_STORE_SIGNAL_FASTPATH
 * 환경변수: process.env.FEATURE_STORE_SIGNAL_FASTPATH
 */
export const FEATURE_STORE_SIGNAL_FASTPATH: boolean = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const forced = (globalThis as any)?.__XEG_FORCE_FLAGS__?.FEATURE_STORE_SIGNAL_FASTPATH;
    if (typeof forced === 'boolean') return forced;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (process as any)?.env?.FEATURE_STORE_SIGNAL_FASTPATH;
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return false; // 기본 OFF (벤치 opt-in)
  } catch {
    return false;
  }
})();

/**
 * Scroll System Refactor 플래그 (SR 단계 진행용)
 * 기본값: true (SR-6 완료로 활성화)
 * 강제 오버라이드: globalThis.__XEG_FORCE_FLAGS__.FEATURE_SCROLL_REFACTORED
 * env: process.env.FEATURE_SCROLL_REFACTORED
 */
export const FEATURE_SCROLL_REFACTORED: boolean = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const forced = (globalThis as any)?.__XEG_FORCE_FLAGS__?.FEATURE_SCROLL_REFACTORED;
    if (typeof forced === 'boolean') return forced;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (process as any)?.env?.FEATURE_SCROLL_REFACTORED;
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return true; // SR-6 완료: 기본값 ON
  } catch {
    return true;
  }
})();

/**
 * (요청 명명) USE_SIGNAL_FASTPATH – selector 최적화 실험용 별칭.
 * 내부적으로 FEATURE_STORE_SIGNAL_FASTPATH 와 동일.
 */
export const USE_SIGNAL_FASTPATH = FEATURE_STORE_SIGNAL_FASTPATH;

// iOS Safari 감지
export function isIOSSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // iPad (iOS 13+)는 MacIntel + 터치포인트 조합으로 노출될 수 있음
  const platform: unknown = (navigator as unknown as { platform?: string }).platform;
  const maxTouchPoints: unknown = (navigator as unknown as { maxTouchPoints?: number })
    .maxTouchPoints;
  const iOS =
    /iPhone|iPad|iPod/i.test(ua) ||
    (platform === 'MacIntel' && typeof maxTouchPoints === 'number' && maxTouchPoints > 1);
  const isSafari = /Safari/i.test(ua) && !/Chrome|CriOS|Firefox|FxiOS|EdgiOS|OPiOS|OPR/i.test(ua);
  return !!(iOS && isSafari);
}
