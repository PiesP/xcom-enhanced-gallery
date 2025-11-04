/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * URL Validator
 *
 * Phase 351.3: Validation Layer - URL 유효성 검증
 */

import { logger } from '../../../logging';

/**
 * Twitter 미디어 URL 유효성 검증
 *
 * 다층 검증:
 * 1. 기본 검증 (null, length, protocol)
 * 2. 도메인 검증 (pbs.twimg.com, video.twimg.com)
 * 3. 경로 검증 (media/, video_thumb/, profile 제외)
 *
 * @param url - 검증할 URL
 * @returns 유효성 여부
 *
 * @example
 * ```ts
 * isValidMediaUrl('https://pbs.twimg.com/media/ABC?format=jpg') // true
 * isValidMediaUrl('https://video.twimg.com/ext_tw_video/123/pu/vid.mp4') // true
 * isValidMediaUrl('https://pbs.twimg.com/profile_images/123.jpg') // false (profile)
 * isValidMediaUrl('https://example.com/image.jpg') // false (도메인 불일치)
 * ```
 */
export function isValidMediaUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // URL 길이 제한 (일반적인 브라우저 제한인 2048자)
  if (url.length > 2048) {
    return false;
  }

  try {
    // 테스트 환경에서 URL 생성자 확인
    let URLConstructor: typeof URL | undefined;

    if (typeof globalThis !== 'undefined' && typeof globalThis.URL === 'function') {
      URLConstructor = globalThis.URL;
    } else if (typeof window !== 'undefined' && typeof window.URL === 'function') {
      URLConstructor = window.URL;
    } else {
      // 테스트 환경에서만 필요한 경우, fallback 사용
      // 브라우저 환경에서는 globalThis.URL 또는 window.URL이 항상 사용 가능
      return isValidMediaUrlFallback(url);
    }

    if (!URLConstructor) {
      return isValidMediaUrlFallback(url);
    }

    const urlObj = new URLConstructor(url);

    // 프로토콜 검증
    if (!verifyUrlProtocol(urlObj.protocol)) {
      return false;
    }

    // 도메인별 경로 검증
    if (urlObj.hostname === 'pbs.twimg.com') {
      return checkPbsMediaPath(urlObj.pathname);
    }

    if (urlObj.hostname === 'video.twimg.com') {
      // video.twimg.com은 모든 경로 허용
      return true;
    }

    // 기타 도메인은 허용하지 않음 (Twitter 미디어만)
    return false;
  } catch (error) {
    // URL 생성이 실패하면 fallback 사용
    logger.warn('URL parsing failed, using fallback:', error);
    return isValidMediaUrlFallback(url);
  }
}

/**
 * Twitter 미디어 도메인 검증
 *
 * @internal
 * @param url - 검증할 URL
 * @returns 트위터 미디어 도메인 여부
 */
export function isTwitterMediaUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'pbs.twimg.com' || urlObj.hostname === 'video.twimg.com';
  } catch {
    return false;
  }
}

/**
 * URL 프로토콜 검증
 *
 * @internal
 * @param protocol - URL protocol (예: 'https:', 'http:')
 * @returns https 또는 http 여부
 */
function verifyUrlProtocol(protocol: string): boolean {
  return protocol === 'https:' || protocol === 'http:';
}

/**
 * pbs.twimg.com 경로 검증
 *
 * @internal
 * @param pathname - URL pathname
 * @returns 유효한 미디어 경로 여부
 */
function checkPbsMediaPath(pathname: string): boolean {
  // pbs.twimg.com은 /media/ 또는 video thumbnail 경로를 포함해야 하고, profile_images는 제외
  const isMedia = pathname.includes('/media/');
  const isVideoThumb =
    /\/ext_tw_video_thumb\//.test(pathname) ||
    /\/tweet_video_thumb\//.test(pathname) ||
    /\/video_thumb\//.test(pathname);

  return (isMedia || isVideoThumb) && !pathname.includes('/profile_images/');
}

/**
 * URL 생성자를 사용할 수 없는 환경에서의 fallback 검증 함수
 *
 * @internal
 * @param url - 검증할 URL
 * @returns 유효성 여부
 */
function isValidMediaUrlFallback(url: string): boolean {
  // 기본적인 프로토콜 검사
  if (!url.startsWith('https://') && !url.startsWith('http://')) {
    return false;
  }

  // 도메인 스푸핑 방지: 정확한 호스트명 매칭
  const protocolRegex = /^https?:\/\/([^/?#]+)/;
  const match = url.match(protocolRegex);
  if (!match) {
    return false;
  }

  const hostname = match[1];

  // 트위터 미디어 도메인 정확한 검사
  if (hostname === 'pbs.twimg.com') {
    const isMedia = url.includes('/media/');
    const isVideoThumb =
      url.includes('/ext_tw_video_thumb/') ||
      url.includes('/tweet_video_thumb/') ||
      url.includes('/video_thumb/');
    return (isMedia || isVideoThumb) && !url.includes('/profile_images/');
  }

  if (hostname === 'video.twimg.com') {
    return true;
  }

  // 지원하지 않는 도메인 명시적 거부
  return false;
}
