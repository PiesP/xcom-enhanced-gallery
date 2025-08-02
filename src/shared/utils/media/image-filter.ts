/**
 * X.com Gallery - Image Filtering System
 *
 * 통합된 고급 이미지 필터링 및 검증 시스템
 * 트위터/X.com 미디어 URL을 검증하고 필터링합니다.
 */

import { removeDuplicates } from '@shared/utils';

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
export interface FilterOptions {
  /** 엄격한 모드 (기본: true) - false시 더 관대한 검증 */
  strict?: boolean;
  /** 비디오 썸네일 허용 여부 (기본: true) */
  allowVideoThumbnails?: boolean;
  /** 동영상 썸네일 제외 여부 (기본: false) */
  excludeVideoThumbnails?: boolean;
  /** 로깅 활성화 여부 (기본: false) */
  enableLogging?: boolean;
  /** 추가 허용 도메인들 */
  additionalDomains?: string[];
  /** 중복 제거 여부 */
  removeDuplicates?: boolean;
  /** 파일 크기 제한 (바이트) */
  maxFileSize?: number;
  /** 커스텀 검증 함수 */
  customValidator?: (url: string) => boolean;
}

/**
 * 상세한 필터링 결과 타입
 */
export interface DetailedFilterResults {
  /** 유효한 URL 목록 */
  validUrls: string[];
  /** 무효한 URL 목록 */
  invalidUrls: string[];
  /** 전체 개수 */
  totalCount: number;
  /** 유효한 개수 */
  validCount: number;
  /** 무효한 개수 */
  invalidCount: number;
  /** 품질별 분류 */
  qualityGroups?: {
    [key: string]: string[];
  };
}

/**
 * 포괄적인 이미지 필터링 결과 타입
 */
export interface ComprehensiveFilterResult {
  /** 필터링된 URL 목록 */
  filtered: string[];
  /** 메타데이터 */
  metadata: {
    totalProcessed: number;
    validCount: number;
    invalidCount: number;
    processingTime: number;
  };
}

/**
 * 트위터/X.com 이미지 URL인지 검증하는 기본 함수
 *
 * @param url - 검증할 URL 문자열
 * @param options - 검증 옵션 (선택적)
 * @returns 유효한 트위터 이미지 URL인지 여부
 */
export function isValidTweetImage(
  url: string | null | undefined,
  options: FilterOptions = {}
): boolean {
  // Null/undefined 검사
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return false;
  }

  // 대소문자 무관하게 처리
  const normalizedUrl = url.toLowerCase().trim();

  // 트위터 도메인 검사
  const twitterDomains = ['pbs.twimg.com', 'video.twimg.com', 'abs.twimg.com', 'abs-0.twimg.com'];

  const isTwitterDomain = twitterDomains.some(domain => normalizedUrl.includes(domain));

  if (!isTwitterDomain) {
    return false;
  }

  // 동영상 썸네일 검사
  const isVideoThumbnail =
    normalizedUrl.includes('/ext_tw_video_thumb/') ||
    normalizedUrl.includes('/amplify_video_thumb/') ||
    normalizedUrl.includes('/tweet_video_thumb/') ||
    normalizedUrl.includes('/tweet_video/');

  if (isVideoThumbnail && options.excludeVideoThumbnails) {
    return false;
  }

  // 미디어 경로 검사
  const validPaths = [
    '/media/',
    '/ext_tw_video_thumb/',
    '/amplify_video_thumb/',
    '/tweet_video_thumb/',
    '/tweet_video/',
  ];

  const hasValidPath = validPaths.some(path => normalizedUrl.includes(path));

  if (!hasValidPath) {
    return false;
  }

  // 이미지 확장자 또는 format 파라미터 검사
  const imageFormats = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  const hasImageFormat = imageFormats.some(
    format => normalizedUrl.includes(`format=${format}`) || normalizedUrl.includes(`.${format}`)
  );

  // format 파라미터가 없어도 미디어 경로면 허용
  return hasImageFormat || normalizedUrl.includes('/media/');
}

/**
 * URL 배열에서 유효한 이미지들만 필터링
 *
 * @param urls - 검증할 URL 배열
 * @param options - 필터링 옵션 (선택적)
 * @returns 유효한 이미지 URL 배열
 */
export function filterValidImages(urls: string[], options: FilterOptions = {}): string[] {
  if (!Array.isArray(urls) || urls.length === 0) {
    return [];
  }

  let filtered = urls.filter(url => isValidTweetImage(url, options));

  // 중복 제거
  if (options.removeDuplicates) {
    filtered = removeDuplicates(filtered);
  }

  // 커스텀 검증
  if (options.customValidator) {
    filtered = filtered.filter(options.customValidator);
  }

  return filtered;
}

/**
 * 상세한 필터링 결과를 반환
 *
 * @param urls - 검증할 URL 배열
 * @param options - 필터링 옵션 (선택적)
 * @returns 상세한 필터링 결과
 */
export function getDetailedFilterResults(
  urls: string[],
  options: FilterOptions = {}
): DetailedFilterResults {
  if (!Array.isArray(urls)) {
    return {
      validUrls: [],
      invalidUrls: [],
      totalCount: 0,
      validCount: 0,
      invalidCount: 0,
    };
  }

  const validUrls: string[] = [];
  const invalidUrls: string[] = [];

  urls.forEach(url => {
    if (isValidTweetImage(url, options)) {
      validUrls.push(url);
    } else {
      invalidUrls.push(url);
    }
  });

  // 품질별 분류 (간단한 예제)
  const qualityGroups = {
    orig: validUrls.filter(url => url.includes('name=orig')),
    large: validUrls.filter(url => url.includes('name=large')),
    medium: validUrls.filter(url => url.includes('name=medium')),
    small: validUrls.filter(url => url.includes('name=small')),
  };

  return {
    validUrls,
    invalidUrls,
    totalCount: urls.length,
    validCount: validUrls.length,
    invalidCount: invalidUrls.length,
    qualityGroups,
  };
}

/**
 * 포괄적인 이미지 필터링 수행
 *
 * @param urls - 검증할 URL 배열
 * @param options - 필터링 옵션 (선택적)
 * @returns 포괄적인 필터링 결과
 */
export function imageFilter(
  urls: string[],
  options: FilterOptions = {}
): ComprehensiveFilterResult {
  const startTime = performance.now();

  const filtered = filterValidImages(urls, options);

  const endTime = performance.now();

  return {
    filtered,
    metadata: {
      totalProcessed: urls.length,
      validCount: filtered.length,
      invalidCount: urls.length - filtered.length,
      processingTime: endTime - startTime,
    },
  };
}
