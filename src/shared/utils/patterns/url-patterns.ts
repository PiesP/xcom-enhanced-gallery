/**
 * URL Pattern Utilities for X.com Enhanced Gallery
 *
 * Centralized URL pattern matching and extraction logic.
 */

import { logger } from '@infrastructure/logging/logger';

/**
 * 트윗 URL 정규표현식 패턴
 * Twitter.com과 x.com 도메인을 모두 지원합니다.
 */
export const TWEET_URL_PATTERN = /https?:\/\/(?:twitter\.com|x\.com)\/([^/]+)\/status\/(\d+)/;

/**
 * URL에서 트윗 정보를 추출하는 통합 함수
 *
 * 주어진 URL에서 사용자명, 트윗 ID, 그리고 트윗 URL을 추출합니다.
 * twitter.com과 x.com 도메인을 모두 지원합니다.
 *
 * @param url - 분석할 URL 문자열
 * @returns 추출된 트윗 정보 객체 또는 null (유효하지 않은 경우)
 *
 * @example
 * ```typescript
 * const info = extractTweetInfoFromUrl('https://x.com/user/status/123456789');
 * if (info) {
 *   console.log(info.username); // 'user'
 *   console.log(info.tweetId);  // '123456789'
 *   console.log(info.tweetUrl); // 'https://x.com/user/status/123456789'
 * }
 * ```
 */
export function extractTweetInfoFromUrl(url: string): {
  username: string;
  tweetId: string;
  tweetUrl: string;
} | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const match = url.match(TWEET_URL_PATTERN);
  if (!match) {
    return null;
  }

  const [, username, tweetId] = match;
  if (!username || !tweetId || username === 'i') {
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
 *
 * @example
 * ```typescript
 * const urls = [
 *   'invalid-url',
 *   'https://x.com/user/status/123456789',
 *   'https://x.com/another/status/987654321'
 * ];
 * const info = extractTweetInfoFromUrls(urls);
 * // 두 번째 URL이 유효하므로 해당 정보를 반환
 * ```
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
 * 이전 버전 호환성:
 * - isValidTweetMediaUrl은 새로운 enhanced-image-filter 모듈의
 *   isValidEnhancedTweetImage(url, { allowVideoThumbnails: true })로 대체되었습니다.
 */

/**
 * HTML 요소에서 트윗 URL 후보들을 추출
 *
 * 주어진 HTML 요소 내에서 트윗 관련 URL들을 찾아 배열로 반환합니다.
 * href 속성과 다양한 data 속성들을 검사합니다.
 *
 * @param element - 검사할 HTML 요소
 * @returns 발견된 트윗 URL 후보들의 배열
 *
 * @example
 * ```typescript
 * const tweetElement = document.querySelector('[data-testid="tweet"]');
 * if (tweetElement) {
 *   const urls = extractTweetUrlCandidates(tweetElement);
 *   console.log('발견된 URL들:', urls);
 * }
 * ```
 */
export function extractTweetUrlCandidates(element: HTMLElement): string[] {
  const urlCandidates: string[] = [];

  try {
    // href 속성에서 추출
    const links = element.querySelectorAll('a[href*="/status/"]');
    links.forEach(link => {
      const href = (link as HTMLAnchorElement).href;
      if (href) {
        urlCandidates.push(href);
      }
    });

    // 기타 URL 관련 속성들
    const urlAttributes = ['href', 'data-href', 'data-url'];
    const allElements = element.querySelectorAll('*');

    allElements.forEach(el => {
      urlAttributes.forEach(attr => {
        const value = el.getAttribute(attr);
        if (value?.includes('/status/')) {
          urlCandidates.push(value);
        }
      });
    });

    // 현재 페이지 URL도 후보에 추가
    if (window.location.href.includes('/status/')) {
      urlCandidates.push(window.location.href);
    }
  } catch (error) {
    logger.debug('Failed to extract URL candidates:', error);
  }

  // 중복 제거
  return [...new Set(urlCandidates)];
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
