/**
 * @fileoverview API 엔드포인트 및 URL 패턴 상수 정의
 *
 * X.com Enhanced Gallery에서 사용되는 API 엔드포인트, URL 패턴, 도메인 관련 상수들을 정의합니다.
 */

/**
 * X.com domain and base URL patterns
 */
export const X_DOMAINS = {
  /** Main X.com domain */
  MAIN: 'x.com',
  /** Legacy Twitter domain */
  LEGACY: 'twitter.com',
  /** Mobile X.com domain */
  MOBILE: 'm.x.com',
} as const;

/**
 * Media CDN domains used by X.com
 */
export const MEDIA_DOMAINS = {
  /** Primary image CDN */
  PABS: 'pbs.twimg.com',
  /** Video CDN */
  VIDEO: 'video.twimg.com',
  /** User profile images */
  PROFILE: 'abs.twimg.com',
} as const;

/**
 * 통합 미디어 URL 패턴 - 프로젝트 전체에서 사용
 *
 * 2단계 시스템을 구현:
 * 1단계: 탐색 패턴 (모든 크기) - DISCOVERY_PATTERN
 * 2단계: 갤러리 패턴 (name=orig만) - GALLERY_PATTERN
 * 동영상 썸네일 지원 추가
 */
export const UNIFIED_MEDIA_PATTERNS = {
  /** 1단계: 탐색용 - 모든 크기의 pbs.twimg.com 이미지 및 동영상 썸네일 허용 */
  DISCOVERY_PATTERN:
    /^https:\/\/pbs\.twimg\.com\/(?:media\/[\w-]+\?format=(?:jpg|jpeg|png|webp)&name=(?:[a-z]+|\d{2,4}x\d{2,4})|[\w-]+_video_thumb\/\d+\/img\/[\w-]+(?:\?.*)?)/,

  /** 2단계: 갤러리용 - 원본 크기 이미지 및 동영상 썸네일 허용 */
  GALLERY_PATTERN:
    /^https:\/\/pbs\.twimg\.com\/(?:media\/[\w-]+\?format=(?:jpg|jpeg|png|webp)&name=orig|[\w-]+_video_thumb\/\d+\/img\/[\w-]+(?:\?.*)?)/,

  /** 미디어 ID 추출 패턴 (일반 미디어) */
  MEDIA_ID_PATTERN: /\/media\/([\w-]+)\?/,

  /** 동영상 썸네일 ID 추출 패턴 */
  VIDEO_THUMB_ID_PATTERN: /\/([\w-]+_video_thumb)\/(\d+)\/img\/([\w-]+)/,

  /** 기본 도메인 검증 패턴 */
  DOMAIN_PATTERN: /^https:\/\/(pbs|video)\.twimg\.com\//,

  /** 지원 도메인들 */
  SUPPORTED_DOMAINS: ['pbs.twimg.com', 'video.twimg.com'] as const,

  /** 지원 포맷들 */
  SUPPORTED_FORMATS: ['jpg', 'jpeg', 'png', 'webp', 'gif'] as const,

  /** 동영상 썸네일 패턴 (갤러리에 포함) */
  VIDEO_THUMBNAIL_PATTERN: /^https:\/\/pbs\.twimg\.com\/[\w-]+_video_thumb\//,

  /** 제외 패턴들 (우선순위 높음) */
  EXCLUDE_PATTERNS: {
    PROFILE_IMAGES: /\/profile_images\//,
    PROFILE_BANNERS: /\/profile_banners\//,
    EMOJI: /\/emoji\//,
    ICONS: /\/icon\//,
    ADS: /\/ads\//,
    PROFILE_SIZES: /_(?:normal|mini|bigger|reasonably_small)\./,
    HASHFLAGS: /\/hashflags\//,
    BRANDED_CONTENT: /\/branded_content\//,
    BUTTONS: /\/button\//,
    WIDGETS: /\/widget\//,
  },
} as const;

/**
 * 미디어 URL 검증 유틸리티 함수들
 * 프로젝트 전체에서 일관되게 사용
 */
export const MEDIA_URL_UTILS = {
  /** 탐색 단계에서 유효한 미디어 URL인지 검증 */
  isValidDiscoveryUrl: (url: string): boolean => {
    return UNIFIED_MEDIA_PATTERNS.DISCOVERY_PATTERN.test(url);
  },

  /** 갤러리 표시용 유효한 미디어 URL인지 검증 */
  isValidGalleryUrl: (url: string): boolean => {
    return UNIFIED_MEDIA_PATTERNS.GALLERY_PATTERN.test(url);
  },

  /** 미디어 ID 추출 */
  extractMediaId: (url: string): string | null => {
    // 일반 미디어 ID 추출
    const match = url.match(UNIFIED_MEDIA_PATTERNS.MEDIA_ID_PATTERN);
    if (match) return match[1];

    // 동영상 썸네일 ID 추출
    const videoMatch = url.match(UNIFIED_MEDIA_PATTERNS.VIDEO_THUMB_ID_PATTERN);
    if (videoMatch) return `${videoMatch[1]}_${videoMatch[2]}_${videoMatch[3]}`;

    return null;
  },

  /** 원본 URL 생성 */
  generateOriginalUrl: (url: string): string | null => {
    // 동영상 썸네일인 경우 그대로 반환 (이미 원본 형태)
    if (UNIFIED_MEDIA_PATTERNS.VIDEO_THUMBNAIL_PATTERN.test(url)) {
      return url;
    }

    // 일반 미디어의 경우 기존 로직 사용
    const mediaId = MEDIA_URL_UTILS.extractMediaId(url);
    if (!mediaId || mediaId.includes('_video_thumb_')) return null; // 동영상 썸네일 ID는 제외

    // 기존 format 파라미터 추출
    const formatMatch = url.match(/[?&]format=([^&]+)/);
    const format = formatMatch?.[1] ?? 'jpg';

    return `https://pbs.twimg.com/media/${mediaId}?format=${format}&name=orig`;
  },

  /** 동영상 썸네일 URL인지 확인 */
  isVideoThumbnailUrl: (url: string): boolean => {
    return UNIFIED_MEDIA_PATTERNS.VIDEO_THUMBNAIL_PATTERN.test(url);
  },

  /** 제외 URL 검증 */
  isExcludedUrl: (url: string): boolean => {
    return Object.values(UNIFIED_MEDIA_PATTERNS.EXCLUDE_PATTERNS).some(pattern =>
      pattern.test(url)
    );
  },

  /**
   * Extract tweet ID from URL
   */
  extractTweetId: (url: string): string | null => {
    const tweetPattern = /https?:\/\/(?:twitter\.com|x\.com)\/([^/]+)\/status\/(\d+)/;
    const match = url.match(tweetPattern);
    return match?.[2] ?? null;
  },
} as const;

/**
 * API endpoints for X.com
 */
export const API_ENDPOINTS = {
  /** X.com GraphQL endpoint */
  GRAPHQL: 'https://x.com/i/api/graphql',
  /** X.com API v2 endpoint */
  API_V2: 'https://api.x.com/2',
} as const;

/**
 * Utility functions for URL operations
 */
export const URL_UTILS = {
  /**
   * Check if URL is from X.com domain
   */
  isXDomain: (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return Object.values(X_DOMAINS).some(
        domain => urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  },

  /**
   * Check if URL is a media URL
   */
  isMediaUrl: (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return Object.values(MEDIA_DOMAINS).some(domain => urlObj.hostname === domain);
    } catch {
      return false;
    }
  },

  /**
   * Extract media ID from URL
   */
  extractMediaId: (url: string): string | null => {
    return MEDIA_URL_UTILS.extractMediaId(url);
  },

  /**
   * Extract tweet ID from URL
   */
  extractTweetId: (url: string): string | null => {
    return MEDIA_URL_UTILS.extractTweetId(url);
  },
} as const;

/**
 * Type definitions for URL-related operations
 */
export type MediaDomain = (typeof MEDIA_DOMAINS)[keyof typeof MEDIA_DOMAINS];
export type XDomain = (typeof X_DOMAINS)[keyof typeof X_DOMAINS];
