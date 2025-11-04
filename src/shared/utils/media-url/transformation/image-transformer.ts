/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * Image URL Transformer
 *
 * Phase 351.5: Transformation Layer - 이미지 URL 변환
 */

import { logger } from '../../../logging';
import { URL_PATTERNS } from '../../patterns/url-patterns';

/**
 * 트위터 이미지 URL에서 원본 고화질 URL 추출
 *
 * 이미지 URL에서 'orig' 파라미터를 설정하여 원본 고화질 버전을 추출합니다.
 * 실패할 경우 폴백 전략을 사용하여 적절한 URL을 반환합니다.
 *
 * @param url - 원본 이미지 URL
 * @returns 원본 고화질 URL ('name=orig' 파라미터 포함)
 *
 * @example
 * // 표준 URL
 * extractOriginalImageUrl('https://pbs.twimg.com/media/ABC123?format=jpg&name=small')
 * // Returns: 'https://pbs.twimg.com/media/ABC123?format=jpg&name=orig'
 *
 * // 이미 orig 설정됨
 * extractOriginalImageUrl('https://pbs.twimg.com/media/ABC123?format=jpg&name=orig')
 * // Returns: 'https://pbs.twimg.com/media/ABC123?format=jpg&name=orig' (동일)
 */
export function extractOriginalImageUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    logger.warn('extractOriginalImageUrl: URL이 비어있거나 문자열이 아님', { url });
    return url;
  }

  try {
    const urlObj = new URL(url);

    // 현재 name 파라미터 확인
    const currentName = urlObj.searchParams.get('name');

    // 이미 orig가 설정되어 있으면 그대로 반환
    if (currentName === 'orig') {
      logger.debug('extractOriginalImageUrl: 이미 orig 파라미터 설정됨', { url });
      return url;
    }

    // name 파라미터를 orig로 설정
    urlObj.searchParams.set('name', 'orig');
    const result = urlObj.toString();

    logger.debug('extractOriginalImageUrl: 원본 URL 추출 성공', {
      originalUrl: url,
      extractedUrl: result,
      previousName: currentName,
    });

    return result;
  } catch (error) {
    // URL 파싱 실패 시 폴백 전략 적용
    logger.debug('extractOriginalImageUrl: URL 파싱 실패, 폴백 전략 적용', {
      url,
      error: error instanceof Error ? error.message : String(error),
    });

    // name 파라미터가 이미 있으면 기존 값을 orig으로 대체
    if (url.includes('?')) {
      const result = `${url.replace(/[?&]name=[^&]*/, '')}&name=orig`;
      logger.debug('extractOriginalImageUrl: 문자열 기반 원본 URL 추출 (기존 name 대체)', {
        result,
      });
      return result;
    }

    // name 파라미터가 없으면 추가
    const result = `${url}?name=orig`;
    logger.debug('extractOriginalImageUrl: 문자열 기반 원본 URL 추출 (new name 파라미터)', {
      result,
    });
    return result;
  }
}

/**
 * 이미지 URL에서 원본('orig') 버전 추출이 가능한지 확인
 *
 * 'orig' 파라미터를 지원하는 Twitter 미디어 이미지 URL인지 검사합니다.
 * pbs.twimg.com/media/ 경로의 이미지만 원본 버전을 지원합니다.
 *
 * @param url - 검증할 URL
 * @returns 원본 추출 가능 여부
 *
 * @example
 * // ✅ 원본 추출 가능
 * canExtractOriginalImage('https://pbs.twimg.com/media/ABC123?format=jpg&name=small')
 *
 * // ❌ 원본 추출 불가능 (이미 orig)
 * canExtractOriginalImage('https://pbs.twimg.com/media/ABC123?format=jpg&name=orig')
 *
 * // ❌ 원본 추출 불가능 (비디오)
 * canExtractOriginalImage('https://video.twimg.com/...')
 */
export function canExtractOriginalImage(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // 이미 orig인 경우 추출 불필요
  try {
    const urlObj = new URL(url);
    if (urlObj.searchParams.get('name') === 'orig') {
      logger.debug('canExtractOriginalImage: 이미 orig 파라미터가 설정됨', { url });
      return false;
    }
  } catch {
    // URL 파싱 실패 시 계속 진행 (fallback 처리)
  }

  // pbs.twimg.com/media/ 경로만 원본 추출 지원
  const isMediaImage = url.includes('pbs.twimg.com') && url.includes('/media/');

  if (isMediaImage) {
    logger.debug('canExtractOriginalImage: 원본 추출 가능', { url });
    return true;
  }

  logger.debug('canExtractOriginalImage: 원본 추출 불가능', {
    url,
    reason: isMediaImage ? 'already orig' : 'not a pbs.twimg.com/media URL',
  });
  return false;
}

/**
 * 미디어 ID 추출 (video thumbnail URL 지원)
 *
 * @param url - 미디어 URL
 * @returns 추출된 미디어 ID 또는 null
 */
export function extractMediaId(url: string): string | null {
  const match = url.match(URL_PATTERNS.MEDIA_ID);
  if (match?.[1]) return match[1];

  const videoMatch = url.match(URL_PATTERNS.VIDEO_THUMB_ID);
  // For ext_tw_video_thumb|video_thumb, group 1 captures the media id (e.g., ZZYYXX)
  // For tweet_video_thumb, group 2 captures the id
  if (videoMatch) {
    return videoMatch[1] || videoMatch[2] || null;
  }

  return null;
}

/**
 * video thumbnail URL을 original media URL로 변환
 *
 * @param url - video thumbnail URL
 * @returns original media URL 또는 null
 */
export function generateOriginalUrl(url: string): string | null {
  const mediaId = extractMediaId(url);
  if (!mediaId) return null;

  const formatMatch = url.match(/[?&]format=([^&]+)/);
  const format = formatMatch?.[1] ?? 'jpg';

  return `https://pbs.twimg.com/media/${mediaId}?format=${format}&name=orig`;
}
