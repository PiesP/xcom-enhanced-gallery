/**
 * URL Pattern Utilities for X.com Gallery
 *
 * Centralized URL pattern matching and extraction logic.
 */

import { logger } from '../../logging/logger';
import { safeParseInt } from '../type-safety-helpers';

/**
 * URL 패턴 매칭 및 추출을 위한 유틸리티 클래스
 */
export const URLPatterns = {
  /**
   * 트윗 URL 정규표현식 패턴
   * Twitter.com과 x.com 도메인을 모두 지원합니다.
   */
  TWEET_URL_PATTERN:
    /https?:\/\/(?:(?:mobile\.|www\.)?twitter\.com|x\.com)\/([^/]+)\/status\/(\d+)/,

  /**
   * 미디어 페이지 URL 정규표현식 패턴
   * x.com과 twitter.com의 미디어 탭을 지원합니다.
   */
  MEDIA_PAGE_PATTERN: /https?:\/\/(?:(?:mobile\.|www\.)?twitter\.com|x\.com)\/([^/]+)\/media/,

  /**
   * 트윗 사진 URL 정규표현식 패턴
   * 미디어 페이지에서의 사진 링크를 지원합니다.
   */
  TWEET_PHOTO_URL_PATTERN:
    /https?:\/\/(?:(?:mobile\.|www\.)?twitter\.com|x\.com)\/([^/]+)\/status\/(\d+)\/photo\/(\d+)/,

  /**
   * X.com URL 패턴
   */
  XCOM_URL_PATTERN: /^https?:\/\/x\.com/,

  /**
   * Twitter.com URL 패턴
   */
  TWITTER_URL_PATTERN: /^https?:\/\/(?:mobile\.|www\.)?twitter\.com/,

  /**
   * 이미지 URL 패턴
   */
  IMAGE_URL_PATTERN: /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i,

  /**
   * 비디오 URL 패턴
   */
  VIDEO_URL_PATTERN: /\.(mp4|webm|mov|avi|mkv|m4v)(\?.*)?$/i,

  /**
   * Twitter 이미지 URL 패턴
   * 프로필 이미지와 기타 비미디어 경로는 제외
   */
  TWITTER_IMAGE_PATTERN: /pbs\.twimg\.com\/media\/.*\.(jpg|jpeg|png|gif|webp)/i,

  /**
   * Twitter 비디오 URL 패턴
   */
  TWITTER_VIDEO_PATTERN: /video\.twimg\.com.*\.(mp4|m3u8)/i,

  /**
   * URL이 X.com 도메인인지 확인합니다
   *
   * @param url - 확인할 URL
   * @returns X.com URL이면 true, 아니면 false
   */
  isXcomUrl(url: string): boolean {
    try {
      if (!url || typeof url !== 'string' || url === 'null' || url === 'undefined') {
        return false;
      }
      return this.XCOM_URL_PATTERN.test(url);
    } catch (error) {
      logger.error('Failed to check X.com URL:', error);
      return false;
    }
  },

  /**
   * URL이 Twitter.com 도메인인지 확인합니다
   *
   * @param url - 확인할 URL
   * @returns Twitter.com URL이면 true, 아니면 false
   */
  isTwitterUrl(url: string): boolean {
    try {
      if (!url || typeof url !== 'string' || url === 'null' || url === 'undefined') {
        return false;
      }
      return this.TWITTER_URL_PATTERN.test(url);
    } catch (error) {
      logger.error('Failed to check Twitter URL:', error);
      return false;
    }
  },

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

  /**
   * URL에서 사용자명을 추출합니다 (트윗 URL 또는 미디어 페이지 URL)
   *
   * @param url - 트윗 URL 또는 미디어 페이지 URL
   * @returns 사용자명 또는 null
   */
  extractUsername(url: string): string | null {
    try {
      if (!url || typeof url !== 'string') {
        return null;
      }

      // 트윗 URL에서 사용자명 추출 시도
      let match = url.match(this.TWEET_URL_PATTERN);
      if (match) {
        const [, username] = match;
        return username && username !== 'i' ? username : null;
      }

      // 트윗 사진 URL에서 사용자명 추출 시도
      match = url.match(this.TWEET_PHOTO_URL_PATTERN);
      if (match) {
        const [, username] = match;
        return username && username !== 'i' ? username : null;
      }

      // 미디어 페이지 URL에서 사용자명 추출 시도
      match = url.match(this.MEDIA_PAGE_PATTERN);
      if (match) {
        const [, username] = match;
        return username && username !== 'i' ? username : null;
      }

      return null;
    } catch (error) {
      logger.error('Failed to extract username:', error);
      return null;
    }
  },

  /**
   * 트윗 사진 URL에서 정보를 추출합니다
   *
   * @param url - 트윗 사진 URL
   * @returns 추출된 정보 또는 null
   */
  extractTweetPhotoInfo(url: string): {
    username: string;
    tweetId: string;
    photoIndex: number;
    photoUrl: string;
  } | null {
    try {
      if (!url || typeof url !== 'string') {
        return null;
      }

      const match = url.match(this.TWEET_PHOTO_URL_PATTERN);
      if (!match) {
        return null;
      }

      const [fullMatch, username, tweetId, photoIndexStr] = match;
      const photoIndex = safeParseInt(photoIndexStr, 10);

      if (!username || !tweetId || username === 'i' || isNaN(photoIndex)) {
        return null;
      }

      return {
        username,
        tweetId,
        photoIndex,
        photoUrl: fullMatch,
      };
    } catch (error) {
      logger.error('Failed to extract tweet photo info:', error);
      return null;
    }
  },

  /**
   * URL이 미디어 페이지 URL인지 확인합니다
   *
   * @param url - 확인할 URL
   * @returns 미디어 페이지 URL이면 true, 아니면 false
   */
  isMediaPageUrl(url: string): boolean {
    try {
      if (!url || typeof url !== 'string') {
        return false;
      }
      return this.MEDIA_PAGE_PATTERN.test(url);
    } catch (error) {
      logger.error('Failed to check media page URL:', error);
      return false;
    }
  },

  /**
   * 미디어 페이지 URL에서 사용자명을 추출합니다
   *
   * @param url - 미디어 페이지 URL
   * @returns 사용자명 또는 null
   */
  extractUsernameFromMediaPage(url: string): string | null {
    try {
      if (!url || typeof url !== 'string') {
        return null;
      }

      const match = url.match(this.MEDIA_PAGE_PATTERN);
      if (!match) {
        return null;
      }

      const [, username] = match;
      return username && username !== 'i' ? username : null;
    } catch (error) {
      logger.error('Failed to extract username from media page:', error);
      return null;
    }
  },

  /**
   * URL이 이미지 URL인지 확인합니다
   *
   * @param url - 확인할 URL
   * @returns 이미지 URL이면 true, 아니면 false
   */
  isImageUrl(url: string): boolean {
    try {
      if (!url || typeof url !== 'string') {
        return false;
      }

      // Twitter 도메인인 경우 더 엄격한 검사
      if (url.includes('twimg.com')) {
        return this.TWITTER_IMAGE_PATTERN.test(url);
      }

      // 기타 도메인의 경우 일반 이미지 패턴 사용
      return this.IMAGE_URL_PATTERN.test(url);
    } catch (error) {
      logger.error('Failed to check image URL:', error);
      return false;
    }
  },

  /**
   * URL이 비디오 URL인지 확인합니다
   *
   * @param url - 확인할 URL
   * @returns 비디오 URL이면 true, 아니면 false
   */
  isVideoUrl(url: string): boolean {
    try {
      if (!url || typeof url !== 'string') {
        return false;
      }
      return this.VIDEO_URL_PATTERN.test(url) || this.TWITTER_VIDEO_PATTERN.test(url);
    } catch (error) {
      logger.error('Failed to check video URL:', error);
      return false;
    }
  },

  /**
   * URL이 미디어 URL인지 확인합니다 (이미지 또는 비디오)
   *
   * @param url - 확인할 URL
   * @returns 미디어 URL이면 true, 아니면 false
   */
  isMediaUrl(url: string): boolean {
    try {
      return this.isImageUrl(url) || this.isVideoUrl(url);
    } catch (error) {
      logger.error('Failed to check media URL:', error);
      return false;
    }
  },

  /**
   * 이미지 URL을 원본 크기로 변환합니다
   *
   * @param url - 이미지 URL
   * @returns 원본 크기 이미지 URL
   */
  getOriginalImageUrl(url: string): string {
    try {
      if (!url || typeof url !== 'string') {
        return url;
      }

      // Twitter/X 이미지 URL에서 크기 제한 파라미터 제거
      if (url.includes('pbs.twimg.com')) {
        // :small, :medium, :large 등의 크기 지정자 제거하고 :orig로 변환
        let result = url.replace(/:(?:small|medium|large|thumb)$/, ':orig');

        // 확장자가 있지만 크기 지정자가 없는 경우 :orig 추가
        if (result.match(/\.(jpg|jpeg|png|gif|webp)$/i) && !result.includes(':orig')) {
          result = `${result}:orig`;
        }

        return result;
      }

      return url;
    } catch (error) {
      logger.error('Failed to get original image URL:', error);
      return url;
    }
  },

  /**
   * URL을 정규화합니다
   *
   * @param url - 정규화할 URL
   * @returns 정규화된 URL
   */
  normalizeUrl(url: string): string {
    try {
      if (!url || typeof url !== 'string') {
        return url;
      }

      let normalized = url.trim();

      // HTML 엔티티 디코딩
      normalized = normalized.replace(/&amp;/g, '&');
      normalized = normalized.replace(/&quot;/g, '"');
      normalized = normalized.replace(/&#39;/g, "'");
      normalized = normalized.replace(/&lt;/g, '<');
      normalized = normalized.replace(/&gt;/g, '>');

      // 따옴표 제거
      normalized = normalized.replace(/^["']|["']$/g, '');

      // 트래킹 파라미터 제거
      normalized = normalized.replace(/[?&](s|t|utm_[^&]*|ref_[^&]*)=[^&]*/g, '');
      normalized = normalized.replace(/[?&]$/, ''); // 마지막 ? 또는 & 제거

      // 해시 제거
      normalized = normalized.replace(/#.*$/, '');

      // 끝의 슬래시 제거
      normalized = normalized.replace(/\/$/, '');

      return normalized;
    } catch (error) {
      logger.error('Failed to normalize URL:', error);
      return url;
    }
  },

  /**
   * URL이 유효한지 확인합니다
   *
   * @param url - 확인할 URL
   * @returns 유효한 URL이면 true, 아니면 false
   */
  isValidUrl(url: string): boolean {
    try {
      if (!url || typeof url !== 'string') {
        return false;
      }

      // 기본적인 URL 형식 체크
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return false;
      }

      // URL 객체 생성으로 유효성 검사
      let URLConstructor: typeof URL | undefined;

      if (typeof globalThis !== 'undefined' && typeof globalThis.URL === 'function') {
        URLConstructor = globalThis.URL;
      } else if (typeof window !== 'undefined' && typeof window.URL === 'function') {
        URLConstructor = window.URL;
      }

      if (!URLConstructor) {
        // Fallback: 기본적인 검증만 수행
        return url.includes('://') && url.length > 10;
      }

      const urlObj = new URLConstructor(url);

      // 추가 검증: hostname이 존재해야 함
      if (urlObj.hostname?.length === 0) {
        return false;
      }

      // 유효하지 않은 포트 번호 체크
      if (urlObj.port && !/^\d+$/.test(urlObj.port)) {
        return false;
      }

      return true;
    } catch {
      // URL이 malformed인 경우 false 반환
      return false;
    }
  },

  /**
   * 상대 URL을 절대 URL로 변환합니다
   *
   * @param relativeUrl - 상대 URL
   * @param baseUrl - 기준 URL
   * @returns 절대 URL
   */
  resolveUrl(relativeUrl: string, baseUrl: string): string {
    try {
      if (!relativeUrl || !baseUrl) {
        return relativeUrl;
      }

      if (this.isValidUrl(relativeUrl)) {
        return relativeUrl;
      }

      let URLConstructor: typeof URL | undefined;

      if (typeof globalThis !== 'undefined' && typeof globalThis.URL === 'function') {
        URLConstructor = globalThis.URL;
      } else if (typeof window !== 'undefined' && typeof window.URL === 'function') {
        URLConstructor = window.URL;
      }

      if (!URLConstructor) {
        // Fallback: 간단한 결합
        return baseUrl.endsWith('/') ? `${baseUrl}${relativeUrl}` : `${baseUrl}/${relativeUrl}`;
      }

      const resolved = new URLConstructor(relativeUrl, baseUrl);

      // 경로 정규화: ../ 등을 명시적으로 처리
      const urlParts = resolved.pathname.split('/');
      const normalizedParts: string[] = [];

      for (const part of urlParts) {
        if (part === '..') {
          normalizedParts.pop();
        } else if (part !== '.' && part !== '') {
          normalizedParts.push(part);
        }
      }

      // 정규화된 경로로 URL 재구성
      const normalizedPath = `/${normalizedParts.join('/')}`;
      const normalizedUrl = new URLConstructor(
        resolved.origin + normalizedPath + resolved.search + resolved.hash
      );

      return normalizedUrl.href;
    } catch (error) {
      logger.error('Failed to resolve URL:', { relativeUrl, baseUrl, error: String(error) });
      return relativeUrl;
    }
  },

  /**
   * 패턴과 일치하는 URL들을 찾습니다
   *
   * @param urls - 검색할 URL 배열
   * @param pattern - 검색 패턴 (문자열 또는 정규식)
   * @returns 일치하는 URL 배열
   */
  findMatchingUrls(urls: string[], pattern: string | RegExp): string[] {
    try {
      if (!Array.isArray(urls) || !pattern) {
        return [];
      }

      const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;

      return urls.filter(url => {
        try {
          return regex.test(url);
        } catch {
          return false;
        }
      });
    } catch {
      return [];
    }
  },

  /**
   * 상대 경로 URL을 절대 경로로 변환합니다
   *
   * @param url - 변환할 URL (상대 경로 또는 절대 경로)
   * @param baseUrl - 기본 URL (기본값: https://x.com)
   * @returns 절대 경로 URL
   */
  makeAbsoluteUrl(url: string, baseUrl: string = 'https://x.com'): string {
    try {
      if (!url || typeof url !== 'string') {
        return url;
      }

      // 이미 절대 경로인 경우
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }

      // 상대 경로인 경우 절대 경로로 변환
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }

      // 프로토콜 없이 도메인으로 시작하는 경우
      if (url.includes('.')) {
        return `https://${url}`;
      }

      // 기타 경우는 기본 URL과 결합
      return `${baseUrl}/${url}`;
    } catch (error) {
      logger.error('Failed to make absolute URL:', error);
      return url;
    }
  },

  /**
   * 미디어 링크에서 트윗 URL을 추출합니다
   * href="/username/status/123/photo/1" 형태의 링크를 처리합니다
   *
   * @param mediaUrl - 미디어 URL (/photo/ 또는 /video/ 포함)
   * @returns 트윗 URL 또는 null
   */
  extractTweetUrlFromMediaLink(mediaUrl: string): string | null {
    try {
      if (!mediaUrl || typeof mediaUrl !== 'string') {
        return null;
      }

      // 미디어 링크가 아닌 경우
      if (!mediaUrl.includes('/photo/') && !mediaUrl.includes('/video/')) {
        return null;
      }

      // 트윗 URL 부분 추출 (/username/status/id 까지)
      const statusMatch = mediaUrl.match(/^(.*\/status\/\d+)/);
      if (!statusMatch?.[1]) {
        return null;
      }

      const statusUrl = statusMatch[1];

      // 절대 경로로 변환
      return this.makeAbsoluteUrl(statusUrl);
    } catch (error) {
      logger.error('Failed to extract tweet URL from media link:', error);
      return null;
    }
  },

  /**
   * 미디어 링크에서 미디어 인덱스를 추출합니다
   *
   * @param mediaUrl - 미디어 URL (/photo/1 또는 /video/2 등 포함)
   * @returns 0-based 미디어 인덱스 또는 undefined
   */
  /**
   * 미디어 링크에서 인덱스 추출 (트위터 미디어 란 특화 개선)
   */
  extractMediaIndexFromLink(mediaUrl: string): number | undefined {
    try {
      if (!mediaUrl || typeof mediaUrl !== 'string') {
        return undefined;
      }

      // 사진 인덱스 찾기 (더 유연한 패턴)
      const photoMatch = mediaUrl.match(/\/photo\/(\d+)(?:[?&#]|$)/);
      if (photoMatch) {
        const index = safeParseInt(photoMatch[1]) - 1; // 1-based → 0-based
        logger.debug('Extracted photo index:', { url: mediaUrl, index });
        return index;
      }

      // 비디오 인덱스 찾기 (더 유연한 패턴)
      const videoMatch = mediaUrl.match(/\/video\/(\d+)(?:[?&#]|$)/);
      if (videoMatch) {
        const index = safeParseInt(videoMatch[1]) - 1; // 1-based → 0-based
        logger.debug('Extracted video index:', { url: mediaUrl, index });
        return index;
      }

      // 쿼리 파라미터에서 미디어 인덱스 찾기 (예: ?media_index=1)
      const queryMatch = mediaUrl.match(/[?&]media_index=(\d+)/);
      if (queryMatch) {
        const index = safeParseInt(queryMatch[1]);
        logger.debug('Extracted media index from query:', { url: mediaUrl, index });
        return index;
      }

      return undefined;
    } catch (error) {
      logger.error('Failed to extract media index from link:', error);
      return undefined;
    }
  },
};

/**
 * 기존 함수들은 하위 호환성을 위해 유지
 */

/**
 * 트윗 URL 정규표현식 패턴
 * Twitter.com과 x.com 도메인을 모두 지원합니다.
 */
export const TWEET_URL_PATTERN = URLPatterns.TWEET_URL_PATTERN;

/**
 * URL에서 트윗 정보를 추출하는 통합 함수
 *
 * 주어진 URL에서 사용자명, 트윗 ID, 그리고 트윗 URL을 추출합니다.
 * twitter.com과 x.com 도메인을 모두 지원합니다.
 *
 * @param url - 분석할 URL 문자열
 * @returns 추출된 트윗 정보 객체 또는 null (유효하지 않은 경우)
 */
export function extractTweetInfoFromUrl(url: string): {
  username: string;
  tweetId: string;
  tweetUrl: string;
} | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const match = url.match(URLPatterns.TWEET_URL_PATTERN);
  if (!match) {
    return null;
  }

  const [, username, tweetId] = match;
  if (!username || !tweetId) {
    return null;
  }

  // 특수 경로들과 잘못된 사용자명 제외
  const invalidUsernames = [
    'i',
    'home',
    'search',
    'explore',
    'notifications',
    'messages',
    'settings',
  ];
  if (invalidUsernames.includes(username.toLowerCase())) {
    return null;
  }

  // 유효한 사용자명 패턴 검증 (영문, 숫자, 언더스코어만 허용, 1-15자)
  if (!/^[a-zA-Z0-9_]{1,15}$/.test(username)) {
    return null;
  }

  return {
    username,
    tweetId,
    tweetUrl: url,
  };
}

/**
 * 여러 URL들을 검사하여 첫 번째 유효한 트윗 정보를 반환
 *
 * 여러 개의 URL 후보 중에서 첫 번째로 유효한 트윗 정보를 찾아 반환합니다.
 * URL 배열을 순서대로 검사하고 첫 번째 매치되는 항목을 반환합니다.
 *
 * @param urls - 검사할 URL 문자열 배열
 * @returns 첫 번째로 유효한 트윗 정보 객체 또는 null (유효한 URL이 없는 경우)
 */
export function extractTweetInfoFromUrls(urls: string[]): {
  username: string;
  tweetId: string;
  tweetUrl: string;
} | null {
  for (const url of urls) {
    const result = extractTweetInfoFromUrl(url);
    if (result) {
      return result;
    }
  }
  return null;
}

/**
 * HTML 요소에서 트윗 URL 후보들을 추출
 *
 * 주어진 HTML 요소 내에서 트윗 관련 URL들을 찾아 배열로 반환합니다.
 * href 속성과 다양한 data 속성들을 검사합니다.
 *
 * @param element - 검사할 HTML 요소
 * @returns 발견된 트윗 URL 후보들의 배열
 */
export function extractTweetUrlCandidates(element: HTMLElement): string[] {
  const urlCandidates: string[] = [];

  try {
    // href 속성에서 추출
    const links = element.querySelectorAll('a[href*="/status/"]');
    links.forEach(link => {
      const href = (link as HTMLAnchorElement).href;
      if (href && !isInvalidStatusUrl(href)) {
        urlCandidates.push(href);
      }
    });

    // 기타 URL 관련 속성들
    const urlAttributes = ['href', 'data-href', 'data-url'];
    const allElements = element.querySelectorAll('*');

    allElements.forEach(el => {
      urlAttributes.forEach(attr => {
        const value = el.getAttribute(attr);
        if (value?.includes('/status/') && !isInvalidStatusUrl(value)) {
          urlCandidates.push(value);
        }
      });
    });

    // 현재 페이지 URL도 후보에 추가 (유효한 경우에만)
    if (window.location.href.includes('/status/') && !isInvalidStatusUrl(window.location.href)) {
      urlCandidates.push(window.location.href);
    }
  } catch (error) {
    logger.debug('Failed to extract URL candidates:', error);
  }

  // 중복 제거
  return [...new Set(urlCandidates)];
}

/**
 * 잘못된 status URL인지 검사하는 헬퍼 함수
 */
export function isInvalidStatusUrl(url: string): boolean {
  if (!url) return true;

  // 잘못된 패턴들
  const invalidPatterns = [
    '/home/status/',
    '/search/status/',
    '/explore/status/',
    '/notifications/status/',
    '/messages/status/',
    '/i/status/',
    '/settings/status/',
  ];

  return invalidPatterns.some(pattern => url.includes(pattern));
}

/**
 * URL 정리 함수 (HTML 엔티티 디코딩 등)
 */
export function cleanUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    let cleaned = url;

    // HTML 엔티티 디코딩
    cleaned = cleaned.replace(/&amp;/g, '&');
    cleaned = cleaned.replace(/&quot;/g, '"');
    cleaned = cleaned.replace(/&#39;/g, "'");
    cleaned = cleaned.replace(/&lt;/g, '<');
    cleaned = cleaned.replace(/&gt;/g, '>');

    // 따옴표 제거
    cleaned = cleaned.replace(/^["']|["']$/g, '');

    return cleaned.trim();
  } catch (error) {
    logger.debug('Failed to clean URL:', error);
    return null;
  }
}

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
