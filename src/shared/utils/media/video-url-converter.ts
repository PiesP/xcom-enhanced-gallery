/**
 * @fileoverview Phase 1-4: Video URL Converter Utility
 * @description Epic: PRODUCTION-ISSUES-OCT-2025
 *
 * 썸네일 URL ↔ 비디오 URL 변환 유틸리티
 * Twitter 미디어 URL 패턴 처리
 */

import { logger } from '@shared/logging/logger';

/**
 * 썸네일 URL을 비디오 URL로 변환
 *
 * 지원 패턴:
 * - tweet_video_thumb → tweet_video (GIF)
 * - ext_tw_video_thumb → ext_tw_video (일반 비디오)
 * - amplify_video_thumb → amplify_video (스폰서 비디오)
 *
 * @param thumbnailUrl - 썸네일 URL
 * @returns 비디오 URL 또는 null
 *
 * @example
 * ```typescript
 * convertThumbnailToVideoUrl('https://pbs.twimg.com/tweet_video_thumb/AbC123.jpg')
 * // => 'https://pbs.twimg.com/tweet_video/AbC123.mp4'
 *
 * convertThumbnailToVideoUrl('https://pbs.twimg.com/ext_tw_video_thumb/123/pu/img/abc.jpg')
 * // => 'https://pbs.twimg.com/ext_tw_video/123/pu/vid/abc.mp4'
 * ```
 */
export function convertThumbnailToVideoUrl(thumbnailUrl: string): string | null {
  if (!thumbnailUrl) {
    logger.debug('[video-url-converter] 빈 썸네일 URL - 변환 실패');
    return null;
  }

  try {
    // JSDOM 환경 대응: URL constructor가 없으면 문자열 처리로 폴백
    let url: URL;
    try {
      url = new URL(thumbnailUrl);
    } catch {
      // JSDOM 환경에서는 문자열 처리로 폴백
      logger.debug('[video-url-converter] URL constructor 미지원 - 문자열 처리로 폴백');

      // tweet_video_thumb → tweet_video (GIF)
      if (thumbnailUrl.includes('tweet_video_thumb')) {
        const converted = thumbnailUrl
          .replace('tweet_video_thumb', 'tweet_video')
          .replace(/\.(jpg|jpeg|png)$/i, '.mp4');

        logger.debug('[video-url-converter] tweet_video_thumb → tweet_video 변환 (fallback)', {
          from: thumbnailUrl,
          to: converted,
        });
        return converted;
      }

      // ext_tw_video_thumb → ext_tw_video (일반 비디오)
      if (thumbnailUrl.includes('ext_tw_video_thumb')) {
        const converted = thumbnailUrl
          .replace('ext_tw_video_thumb', 'ext_tw_video')
          .replace(/\/pu\/img\//i, '/pu/vid/')
          .replace(/\.(jpg|jpeg|png)$/i, '.mp4');

        logger.debug('[video-url-converter] ext_tw_video_thumb → ext_tw_video 변환 (fallback)', {
          from: thumbnailUrl,
          to: converted,
        });
        return converted;
      }

      // amplify_video_thumb → amplify_video (스폰서 비디오)
      if (thumbnailUrl.includes('amplify_video_thumb')) {
        const converted = thumbnailUrl
          .replace('amplify_video_thumb', 'amplify_video')
          .replace(/\/pu\/img\//i, '/pu/vid/')
          .replace(/\.(jpg|jpeg|png)$/i, '.mp4');

        logger.debug('[video-url-converter] amplify_video_thumb → amplify_video 변환 (fallback)', {
          from: thumbnailUrl,
          to: converted,
        });
        return converted;
      }

      // 비디오 썸네일 패턴이 아님
      logger.debug('[video-url-converter] 비디오 썸네일 패턴 없음 (fallback)', { thumbnailUrl });
      return null;
    }

    // URL constructor 사용 가능한 경우 (브라우저 환경)
    // tweet_video_thumb → tweet_video (GIF)
    if (url.pathname.includes('tweet_video_thumb')) {
      const converted = url.href
        .replace('tweet_video_thumb', 'tweet_video')
        .replace(/\.(jpg|jpeg|png)$/i, '.mp4');

      logger.debug('[video-url-converter] tweet_video_thumb → tweet_video 변환', {
        from: thumbnailUrl,
        to: converted,
      });
      return converted;
    }

    // ext_tw_video_thumb → ext_tw_video (일반 비디오)
    if (url.pathname.includes('ext_tw_video_thumb')) {
      // /pu/img/ → /pu/vid/로 변경
      const converted = url.href
        .replace('ext_tw_video_thumb', 'ext_tw_video')
        .replace(/\/pu\/img\//i, '/pu/vid/')
        .replace(/\.(jpg|jpeg|png)$/i, '.mp4');

      logger.debug('[video-url-converter] ext_tw_video_thumb → ext_tw_video 변환', {
        from: thumbnailUrl,
        to: converted,
      });
      return converted;
    }

    // amplify_video_thumb → amplify_video (스폰서 비디오)
    if (url.pathname.includes('amplify_video_thumb')) {
      const converted = url.href
        .replace('amplify_video_thumb', 'amplify_video')
        .replace(/\/pu\/img\//i, '/pu/vid/')
        .replace(/\.(jpg|jpeg|png)$/i, '.mp4');

      logger.debug('[video-url-converter] amplify_video_thumb → amplify_video 변환', {
        from: thumbnailUrl,
        to: converted,
      });
      return converted;
    }

    // 변환 패턴 매칭 실패
    logger.debug('[video-url-converter] 변환 패턴 매칭 실패', {
      url: thumbnailUrl,
      pathname: url.pathname,
    });
    return null;
  } catch (error) {
    logger.warn('[video-url-converter] URL 파싱 실패', {
      thumbnailUrl,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * 비디오 URL을 썸네일 URL로 변환
 *
 * @param videoUrl - 비디오 URL
 * @returns 썸네일 URL 또는 null
 *
 * @example
 * ```typescript
 * convertVideoToThumbnailUrl('https://pbs.twimg.com/tweet_video/AbC123.mp4')
 * // => 'https://pbs.twimg.com/tweet_video_thumb/AbC123.jpg'
 * ```
 */
export function convertVideoToThumbnailUrl(videoUrl: string): string | null {
  if (!videoUrl) {
    logger.debug('[video-url-converter] 빈 비디오 URL - 변환 실패');
    return null;
  }

  try {
    const url = new URL(videoUrl);

    // tweet_video → tweet_video_thumb (GIF)
    if (url.pathname.includes('tweet_video') && !url.pathname.includes('_thumb')) {
      const converted = url.href
        .replace('tweet_video', 'tweet_video_thumb')
        .replace(/\.mp4$/i, '.jpg');

      logger.debug('[video-url-converter] tweet_video → tweet_video_thumb 변환', {
        from: videoUrl,
        to: converted,
      });
      return converted;
    }

    // ext_tw_video → ext_tw_video_thumb (일반 비디오)
    if (url.pathname.includes('ext_tw_video') && !url.pathname.includes('_thumb')) {
      const converted = url.href
        .replace('ext_tw_video', 'ext_tw_video_thumb')
        .replace(/\/pu\/vid\//i, '/pu/img/')
        .replace(/\.mp4$/i, '.jpg');

      logger.debug('[video-url-converter] ext_tw_video → ext_tw_video_thumb 변환', {
        from: videoUrl,
        to: converted,
      });
      return converted;
    }

    // amplify_video → amplify_video_thumb (스폰서 비디오)
    if (url.pathname.includes('amplify_video') && !url.pathname.includes('_thumb')) {
      const converted = url.href
        .replace('amplify_video', 'amplify_video_thumb')
        .replace(/\/pu\/vid\//i, '/pu/img/')
        .replace(/\.mp4$/i, '.jpg');

      logger.debug('[video-url-converter] amplify_video → amplify_video_thumb 변환', {
        from: videoUrl,
        to: converted,
      });
      return converted;
    }

    logger.debug('[video-url-converter] 변환 패턴 매칭 실패', {
      url: videoUrl,
      pathname: url.pathname,
    });
    return null;
  } catch (error) {
    logger.warn('[video-url-converter] URL 파싱 실패', {
      videoUrl,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
