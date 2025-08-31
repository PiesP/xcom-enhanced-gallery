/**
 * @fileoverview 미디어 관련 상수
 * @description 통합된 미디어 상수 정의
 */

/**
 * 미디어 품질 상수
 */
export const MEDIA_QUALITY = Object.freeze({
  ORIGINAL: 'orig',
  LARGE: 'large',
  MEDIUM: 'medium',
  SMALL: 'small',
} as const);

/**
 * 미디어 타입 상수
 */
export const MEDIA_TYPES = Object.freeze({
  IMAGE: 'image',
  VIDEO: 'video',
  GIF: 'gif',
} as const);

/**
 * 미디어 확장자 상수
 */
export const MEDIA_EXTENSIONS = Object.freeze({
  JPEG: 'jpg',
  PNG: 'png',
  WEBP: 'webp',
  GIF: 'gif',
  MP4: 'mp4',
  ZIP: 'zip',
} as const);

/**
 * 지원하는 미디어 도메인
 */
export const MEDIA_DOMAINS = Object.freeze([
  'pbs.twimg.com',
  'video.twimg.com',
  'abs.twimg.com',
] as const);

/**
 * URL 패턴 상수들 (통합됨)
 */
export const URL_PATTERNS = {
  /** 일반 미디어 URL 패턴 */
  MEDIA:
    /^https:\/\/pbs\.twimg\.com\/(?:media\/[\w-]+\?format=(?:jpg|jpeg|png|webp)&name=(?:[a-z]+|\d{2,4}x\d{2,4})|ext_tw_video_thumb\/\d+\/pu\/img\/[\w-]+(?:\?.*)?)/,

  /** 갤러리용 미디어 패턴 */
  GALLERY_MEDIA:
    /^https:\/\/pbs\.twimg\.com\/(?:media\/[\w-]+\?format=(?:jpg|jpeg|png|webp)&name=orig|ext_tw_video_thumb\/\d+\/pu\/img\/[\w-]+(?:\?.*)?)/,

  /** 미디어 ID 추출 패턴 */
  MEDIA_ID: /\/media\/([\w-]+)(?:\?|\.)/,

  /** 비디오 썸네일 ID 추출 패턴 */
  VIDEO_THUMB_ID: /\/ext_tw_video_thumb\/(\d+)\/pu\/img\/([\w-]+)/,

  /** 트윗 ID 추출 패턴 */
  TWEET_ID: /https?:\/\/(?:twitter\.com|x\.com)\/([^/]+)\/status\/(\d+)/,
} as const;

/**
 * 미디어 URL이 유효한지 확인
 *
 * @param url 확인할 URL
 * @returns 유효성 여부
 */
export function isValidMediaUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  return URL_PATTERNS.MEDIA.test(url);
}

/**
 * 갤러리용 미디어 URL인지 확인
 */
export function isValidGalleryUrl(url: string): boolean {
  return URL_PATTERNS.GALLERY_MEDIA.test(url);
}

/**
 * 트윗 ID 추출
 */
export function extractTweetId(url: string): string | null {
  const match = url.match(URL_PATTERNS.TWEET_ID);
  return match?.[2] ?? null;
}

/**
 * 미디어 ID 추출 - 통합된 추출 로직
 *
 * @param url 미디어 URL
 * @returns 미디어 ID 또는 null
 */
export function extractMediaId(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // 패턴 1: 일반 미디어 URL - /media/ABC123
  const mediaMatch = url.match(URL_PATTERNS.MEDIA_ID);
  if (mediaMatch?.[1]) {
    return mediaMatch[1];
  }

  // 패턴 2: 비디오 썸네일 URL - /ext_tw_video_thumb/123/pu/img/DEF456
  // 여기서 DEF456이 실제 미디어 ID
  const videoMatch = url.match(URL_PATTERNS.VIDEO_THUMB_ID);
  if (videoMatch?.[2]) {
    return videoMatch[2]; // 두 번째 캡처 그룹이 실제 ID
  }

  return null;
}

/**
 * 원본 URL 생성
 *
 * @param url 미디어 URL
 * @returns 원본 URL 또는 null
 */
export function generateOriginalUrl(url: string): string | null {
  const mediaId = extractMediaId(url);
  if (!mediaId) return null;

  const formatMatch = url.match(/[?&]format=([^&]+)/);
  const format = formatMatch?.[1] ?? 'jpg';

  return `https://pbs.twimg.com/media/${mediaId}?format=${format}&name=orig`;
}

/**
 * 타입 정의
 */
export type MediaQuality = (typeof MEDIA_QUALITY)[keyof typeof MEDIA_QUALITY];
export type MediaType = (typeof MEDIA_TYPES)[keyof typeof MEDIA_TYPES];
export type MediaExtension = (typeof MEDIA_EXTENSIONS)[keyof typeof MEDIA_EXTENSIONS];
