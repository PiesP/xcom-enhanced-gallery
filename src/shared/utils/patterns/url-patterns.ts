/**
 * URL Pattern Utilities for X.com Gallery
 *
 * Centralized URL pattern matching and extraction logic.
 * Phase 129 optimized: removed unused methods to reduce bundle size.
 */

import { logger } from '@shared/logging';

/**
 * URL 패턴 매칭 및 추출을 위한 유틸리티 클래스
 * Phase 129: 실제 사용되는 메서드만 유지
 */
export const URLPatterns = {
  /**
   * 트윗 URL 정규표현식 패턴
   * Twitter.com과 x.com 도메인을 모두 지원합니다.
   */
  TWEET_URL_PATTERN:
    /https?:\/\/(?:(?:mobile\.|www\.)?twitter\.com|x\.com)\/([^/]+)\/status\/(\d+)/,

  /**
   * URL에서 트윗 ID를 추출합니다
   *
   * @param url - 트윗 URL
   * @returns 트윗 ID 또는 null
   */
  extractTweetId(url: string): string | null {
    try {
      if (!url || typeof url !== 'string') {
        return null;
      }

      const match = url.match(this.TWEET_URL_PATTERN);
      if (!match) {
        return null;
      }

      const [, , tweetId] = match;
      return tweetId || null;
    } catch (error) {
      logger.error('Failed to extract tweet ID:', error);
      return null;
    }
  },
};

/**
 * 하위 호환성을 위한 export
 */
export const TWEET_URL_PATTERN = URLPatterns.TWEET_URL_PATTERN;

/**
 * URL 패턴(상위 호환) — constants.ts 호환 API
 *
 * NOTE:
 *  - 프로젝트 내 레거시 소비처가 기대하는 키 이름과 정규식 형태를 유지합니다.
 *  - 단일 소스 원칙: 이 객체만이 정규식 정의의 단일 출처입니다.
 *  - constants.ts에서는 이 객체를 import하여 재노출(re-export)만 수행합니다.
 */
export const URL_PATTERNS = Object.freeze({
  /** 미디어 URL 패턴 */
  MEDIA:
    /^https:\/\/pbs\.twimg\.com\/(?:media\/[\w-]+\?format=(?:jpg|jpeg|png|webp)&name=(?:[a-z]+|\d{2,4}x\d{2,4})|(?:ext_tw_video_thumb|video_thumb)\/\d+(?:\/pu)?\/img\/[\w-]+(?:\?.*)?|tweet_video_thumb\/[\w-]+(?:\?.*)?)/,

  /** 갤러리용 미디어 패턴 */
  GALLERY_MEDIA:
    /^https:\/\/pbs\.twimg\.com\/(?:media\/[\w-]+\?format=(?:jpg|jpeg|png|webp)&name=orig|(?:ext_tw_video_thumb|video_thumb)\/\d+(?:\/pu)?\/img\/[\w-]+(?:\?.*)?|tweet_video_thumb\/[\w-]+(?:\?.*)?)/,

  /** 미디어 ID 추출 */
  MEDIA_ID: /\/media\/([\w-]+)\?/,

  /** 동영상 썸네일 ID 추출 (ext_tw_video_thumb|video_thumb|tweet_video_thumb) */
  VIDEO_THUMB_ID:
    /\/(?:(?:ext_tw_video_thumb|video_thumb)\/\d+(?:\/pu)?\/img\/([\w-]+)(?:\.[a-z0-9]+)?|tweet_video_thumb\/([\w-]+)(?:\.[a-z0-9]+)?)(?=[?/]|$)/,

  /** 트윗 ID 추출 (constants.ts 호환) */
  TWEET_ID: /https?:\/\/(?:twitter\.com|x\.com)\/([^/]+)\/status\/(\d+)/,
} as const) as {
  MEDIA: RegExp;
  GALLERY_MEDIA: RegExp;
  MEDIA_ID: RegExp;
  VIDEO_THUMB_ID: RegExp;
  TWEET_ID: RegExp;
};
