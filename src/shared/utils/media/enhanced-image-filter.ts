/**
 * X.com Enhanced Gallery - Enhanced Image Filtering System
 *
 * 통합된 고급 이미지 필터링 및 검증 시스템
 * UNIFIED_MEDIA_PATTERNS를 기반으로 한 일관된 검증 로직을 제공합니다.
 */

import { MEDIA_URL_UTILS } from '@core/constants/twitter-endpoints';
import { logger } from '@infrastructure/logging/logger';

/**
 * 이미지 필터링 결과 타입
 */
export interface ImageFilterResult {
  /** 유효한 이미지 URL인지 여부 */
  isValid: boolean;
  /** 검증 실패 이유 (isValid가 false일 때) */
  reason?: string;
  /** 감지된 이미지 형식 */
  format?: string;
  /** 미디어 도메인 타입 */
  domain?: 'pbs' | 'video' | 'abs' | 'abs-0';
  /** 미디어 경로 타입 */
  pathType?: 'media' | 'tweet_video_thumb' | 'amplify_video_thumb' | 'ext_tw_video' | 'tweet_video';
  /** 원본 URL */
  url: string;
}

/**
 * 고급 이미지 필터링 옵션
 */
export interface EnhancedFilterOptions {
  /** 엄격한 모드 (기본: true) - false시 더 관대한 검증 */
  strict?: boolean;
  /** 비디오 썸네일 허용 여부 (기본: true) */
  allowVideoThumbnails?: boolean;
  /** 로깅 활성화 여부 (기본: false) */
  enableLogging?: boolean;
  /** 추가 허용 도메인들 */
  additionalDomains?: string[];
}

/**
 * URL에서 도메인 타입을 추출하는 헬퍼 함수
 */
function extractDomainFromUrl(url: string): 'pbs' | 'video' | 'abs' | 'abs-0' | undefined {
  if (url.includes('pbs.twimg.com')) {
    return 'pbs';
  }
  if (url.includes('video.twimg.com')) {
    return 'video';
  }
  if (url.includes('abs-0.twimg.com')) {
    return 'abs-0';
  }
  if (url.includes('abs.twimg.com')) {
    return 'abs';
  }
  return undefined;
}

/**
 * URL에서 이미지 형식을 추출하는 헬퍼 함수
 */
function extractFormatFromUrl(url: string): string | undefined {
  const formatMatch = url.match(/[?&]format=([^&]+)/);
  if (formatMatch?.[1]) {
    return formatMatch[1].toLowerCase();
  }

  // URL 확장자에서 추출 시도
  const extensionMatch = url.match(/\.([a-z]{3,4})(?:[?#]|$)/i);
  if (extensionMatch?.[1]) {
    return extensionMatch[1].toLowerCase();
  }

  return undefined;
}

/**
 * 향상된 X.com 이미지 URL 필터링 및 검증
 *
 * 통합된 미디어 패턴을 사용하여 일관된 검증을 제공합니다.
 *
 * @param url - 검증할 URL 문자열
 * @param options - 필터링 옵션 (선택적)
 * @returns 상세한 검증 결과
 *
 * @example
 * ```typescript
 * const result = enhancedImageFilter('https://pbs.twimg.com/media/ABC123?format=jpg&name=large');
 * if (result.isValid) {
 *   console.log(`Valid ${result.format} image from ${result.domain}`);
 * } else {
 *   console.log(`Invalid: ${result.reason}`);
 * }
 * ```
 */
export function enhancedImageFilter(
  url: string,
  options: EnhancedFilterOptions = {}
): ImageFilterResult {
  const {
    strict = true,
    allowVideoThumbnails = true,
    enableLogging = false,
    additionalDomains = [],
  } = options;

  const result: ImageFilterResult = {
    isValid: false,
    url,
  };

  // 1. 기본 유효성 검사
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    result.reason = 'Empty or invalid URL';
    if (enableLogging) {
      logger.debug('Image filter failed: empty URL');
    }
    return result;
  }

  const cleanUrl = url.trim();

  try {
    // URL 형식 검증
    new URL(cleanUrl);
  } catch {
    result.reason = 'Invalid URL format';
    if (enableLogging) {
      logger.debug(`Image filter failed: invalid URL format - ${cleanUrl}`);
    }
    return result;
  }

  // 2. 탐색 단계 검증 (관대한 검증)
  if (!strict && MEDIA_URL_UTILS.isValidDiscoveryUrl(cleanUrl)) {
    result.isValid = true;
    result.format = extractFormatFromUrl(cleanUrl) ?? undefined;
    result.domain = extractDomainFromUrl(cleanUrl) ?? undefined;
    if (enableLogging) {
      logger.debug(`Valid discovery URL: ${cleanUrl}`);
    }
    return result;
  }

  // 3. 갤러리 단계 검증 (엄격한 검증)
  if (MEDIA_URL_UTILS.isValidGalleryUrl(cleanUrl)) {
    result.isValid = true;
    result.format = extractFormatFromUrl(cleanUrl) ?? undefined;
    result.domain = extractDomainFromUrl(cleanUrl) ?? undefined;
    if (enableLogging) {
      logger.debug(`Valid gallery URL: ${cleanUrl}`);
    }
    return result;
  }

  // 4. 제외 패턴 검사
  if (MEDIA_URL_UTILS.isExcludedUrl(cleanUrl)) {
    result.reason = 'URL matches excluded pattern';
    if (enableLogging) {
      logger.debug(`Image filter failed: excluded pattern - ${cleanUrl}`);
    }
    return result;
  }

  // 5. 추가 검증 로직 (기존 호환성)
  if (allowVideoThumbnails && cleanUrl.includes('video.twimg.com')) {
    result.isValid = true;
    result.domain = 'video';
    result.format = extractFormatFromUrl(cleanUrl) ?? 'jpg';
    return result;
  }

  // 6. 추가 도메인 검사
  if (additionalDomains.length > 0) {
    for (const domain of additionalDomains) {
      if (cleanUrl.includes(domain)) {
        result.isValid = true;
        result.format = extractFormatFromUrl(cleanUrl) ?? undefined;
        result.domain = extractDomainFromUrl(cleanUrl) ?? undefined;
        return result;
      }
    }
  }

  result.reason = 'URL does not match valid media patterns';
  if (enableLogging) {
    logger.debug(`Image filter failed: no pattern match - ${cleanUrl}`);
  }
  return result;
}

/**
 * 간단한 boolean 결과를 반환하는 호환성 함수
 *
 * @param url - 검증할 URL
 * @param options - 필터링 옵션
 * @returns 유효한 이미지 URL인지 여부
 */
export function isValidEnhancedTweetImage(
  url: string,
  options: EnhancedFilterOptions = {}
): boolean {
  return enhancedImageFilter(url, options).isValid;
}

/**
 * 여러 URL을 한번에 필터링
 *
 * @param urls - 검증할 URL 배열
 * @param options - 필터링 옵션
 * @returns 유효한 URL들의 배열
 */
export function filterValidImages(urls: string[], options: EnhancedFilterOptions = {}): string[] {
  return urls.filter(url => isValidEnhancedTweetImage(url, options));
}

/**
 * URL 배열에서 상세한 필터링 결과를 반환
 *
 * @param urls - 검증할 URL 배열
 * @param options - 필터링 옵션
 * @returns 각 URL의 상세한 검증 결과 배열
 */
export function getDetailedFilterResults(
  urls: string[],
  options: EnhancedFilterOptions = {}
): ImageFilterResult[] {
  return urls.map(url => enhancedImageFilter(url, options));
}

/**
 * 기존 함수들과의 호환성을 위한 래퍼 함수들
 *
 * 이전 버전 호환성:
 * - isValidTweetImage -> isValidEnhancedTweetImage(url, { strict: true })
 * - isValidImageUrl -> isValidEnhancedTweetImage(url, { strict: false })
 * - isValidTweetMediaUrl -> isValidEnhancedTweetImage(url, { allowVideoThumbnails: true })
 *
 * 이 함수들은 완전히 제거되었습니다. 위 매핑을 참고하여 새로운 함수를 사용하세요.
 */
