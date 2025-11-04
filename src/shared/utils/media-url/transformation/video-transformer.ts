/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * Video URL Transformer
 *
 * Phase 351.5: Transformation Layer - 비디오 URL 변환
 */

import { logger } from '../../../logging';

/**
 * 비디오 원본 URL 최적화 (Phase 330)
 *
 * video.twimg.com 비디오의 품질을 최적화합니다.
 * Twitter API 분석 결과:
 * - tag=12: MP4 형식 (최고 품질, 권장)
 * - tag=13: WebM 형식 (모바일 최적화)
 * - 없음: 기본값 (불안정)
 *
 * @param url - 비디오 URL (예: https://video.twimg.com/vi/1234567890/pu.mp4?tag=12)
 * @returns 최적화된 URL (tag=12 보장)
 *
 * @example
 * // ✅ tag 파라미터 추가
 * extractOriginalVideoUrl('https://video.twimg.com/vi/1234567890/pu.mp4')
 * // → 'https://video.twimg.com/vi/1234567890/pu.mp4?tag=12'
 *
 * // ✅ tag=12 유지
 * extractOriginalVideoUrl('https://video.twimg.com/vi/1234567890/pu.mp4?tag=12')
 * // → 'https://video.twimg.com/vi/1234567890/pu.mp4?tag=12'
 *
 * // ✅ tag=13 → tag=12로 변경
 * extractOriginalVideoUrl('https://video.twimg.com/vi/1234567890/pu.mp4?tag=13')
 * // → 'https://video.twimg.com/vi/1234567890/pu.mp4?tag=12'
 */
export function extractOriginalVideoUrl(url: string): string {
  // 입력 검증
  if (!url || typeof url !== 'string') {
    logger.warn('extractOriginalVideoUrl: URL이 비어있거나 문자열이 아님', { url });
    return url || '';
  }

  try {
    // URL 파싱을 통한 tag 파라미터 처리
    const urlObj = new URL(url);
    const searchParams = urlObj.searchParams;

    // tag=12 이미 설정되어 있으면 반환
    if (searchParams.get('tag') === '12') {
      logger.debug('extractOriginalVideoUrl: 이미 최적 tag=12 설정됨', { url });
      return url;
    }

    // tag 파라미터 설정 또는 변경 (12로 통일)
    searchParams.set('tag', '12');
    const optimizedUrl = urlObj.toString();

    logger.debug('extractOriginalVideoUrl: 비디오 URL 최적화 성공', {
      original: url,
      optimized: optimizedUrl,
      changed: url !== optimizedUrl,
    });

    return optimizedUrl;
  } catch (error) {
    // URL 파싱 실패 시 폴백: 문자열 기반 처리
    logger.debug('extractOriginalVideoUrl: URL 파싱 실패, 폴백 전략 적용', {
      url,
      error: (error as Error).message,
    });

    // 폴백: 문자열 기반 처리
    if (url.includes('?')) {
      // 기존 쿼리 파라미터가 있는 경우
      const [base, params] = url.split('?');
      const searchParams = new URLSearchParams(params);
      const previousTag = searchParams.get('tag');
      searchParams.set('tag', '12');
      const fallbackUrl = `${base}?${searchParams.toString()}`;

      logger.debug('extractOriginalVideoUrl: 문자열 기반 tag 파라미터 변경', {
        original: url,
        fallback: fallbackUrl,
        previousTag,
      });

      return fallbackUrl;
    }
    // 쿼리 파라미터가 없는 경우
    const fallbackUrl = `${url}?tag=12`;
    logger.debug('extractOriginalVideoUrl: 문자열 기반 tag 파라미터 추가', {
      original: url,
      fallback: fallbackUrl,
    });

    return fallbackUrl;
  }
}

/**
 * 사전 검증: 비디오 원본 최적화 가능 여부 (Phase 330)
 *
 * video.twimg.com/vi/ 형식의 URL이 tag 파라미터를 통한
 * 최적화를 지원하는지 확인합니다.
 *
 * @param url - 검증할 URL
 * @returns 최적화 가능 여부
 *
 * @example
 * // ✅ 원본 최적화 가능
 * canExtractOriginalVideo('https://video.twimg.com/vi/1234567890/pu.mp4')
 *
 * // ✅ 이미 최적화됨 (여전히 true - 함수명과는 다르지만 최적화 가능 상태)
 * canExtractOriginalVideo('https://video.twimg.com/vi/1234567890/pu.mp4?tag=12')
 *
 * // ❌ 최적화 불가능 (GIF)
 * canExtractOriginalVideo('https://pbs.twimg.com/media/ABC123/video.jpg')
 *
 * // ❌ 최적화 불가능 (애드 비디오)
 * canExtractOriginalVideo('https://amplifeed.twimg.com/...')
 */
export function canExtractOriginalVideo(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // video.twimg.com/vi/ 형식만 tag 파라미터 최적화 지원
  const isVideoTwimgUrl = url.includes('video.twimg.com') && url.includes('/vi/');

  if (isVideoTwimgUrl) {
    logger.debug('canExtractOriginalVideo: 비디오 최적화 가능', { url });
    return true;
  }

  logger.debug('canExtractOriginalVideo: 비디오 최적화 불가능', {
    url,
    reason: !url.includes('video.twimg.com') ? 'not video.twimg.com' : 'not /vi/ path',
  });
  return false;
}

/**
 * 영상 섬네일 URL에서 video ID 추출
 *
 * @param url - 영상 섬네일 URL
 * @returns video ID (예: "1931629000243453952") 또는 null
 */
export function extractVideoIdFromThumbnail(url: string): string | null {
  // isVideoThumbnailUrl() 의존성 제거 - 독립적으로 검증
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const urlObj = new URL(url);

    // pbs.twimg.com이 아니면 섬네일이 아님
    if (urlObj.hostname !== 'pbs.twimg.com') {
      return null;
    }

    // video thumbnail 패턴 확인
    const isVideoThumb =
      /\/(amplify_video_thumb|ext_tw_video_thumb|tweet_video_thumb|ad_img\/amplify_video)\//i.test(
        urlObj.pathname
      );

    if (!isVideoThumb) {
      return null;
    }

    // 경로 예: /amplify_video_thumb/1931629000243453952/img/wzXQeHFbVbPENOya
    // video ID는 두 번째 경로 세그먼트
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);

    // amplify_video_thumb 또는 ext_tw_video_thumb 인덱스 찾기
    const thumbIndex = pathSegments.findIndex(seg =>
      /^(amplify_video_thumb|ext_tw_video_thumb)$/i.test(seg)
    );

    if (thumbIndex === -1 || thumbIndex + 1 >= pathSegments.length) {
      return null;
    }

    const videoId = pathSegments[thumbIndex + 1];

    // video ID는 숫자여야 함
    if (!videoId || !/^\d+$/.test(videoId)) {
      return null;
    }

    return videoId;
  } catch {
    return null;
  }
}

/**
 * 영상 섬네일에서 동영상 URL로 변환
 *
 * @param thumbnailUrl - 영상 섬네일 URL
 * @returns 동영상 URL (video.twimg.com 포맷) 또는 null
 */
export function convertThumbnailToVideoUrl(thumbnailUrl: string): string | null {
  const videoId = extractVideoIdFromThumbnail(thumbnailUrl);
  if (!videoId) {
    return null;
  }

  // Twitter 동영상 표준 형식
  // 예: https://video.twimg.com/vi/1931629000243453952/pu.mp4
  try {
    return new URL(`https://video.twimg.com/vi/${videoId}/pu.mp4`).toString();
  } catch {
    return null;
  }
}
