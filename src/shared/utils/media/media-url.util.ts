/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * Media URL Utility
 *
 * 트윗에서 실제 미디어 URL을 추출하는 유틸리티 함수들
 * BackgroundTweetLoader와 함께 사용되어 정확한 미디어 정보를 제공합니다.
 */

import { logger } from '@shared/logging';
import { getMediaFilenameService } from '@shared/container/service-accessors';
import type { FilenameOptions } from '@shared/services/file-naming';
// Username은 shared/media/username-source 헬퍼를 통해 제공
import { getPreferredUsername } from '../../media/username-source';
export type { FilenameOptions };
import type { MediaInfo } from '../../types/media.types';
import { cachedQuerySelector, cachedQuerySelectorAll } from '../../dom';
import { SELECTORS } from '../../../constants';
import { URL_PATTERNS } from '../patterns/url-patterns';

/**
 * 트윗 document에서 미디어 URL들을 추출
 *
 * @param doc - 트윗이 로드된 document 또는 documentElement
 * @param tweetId - 트윗 ID
 * @returns 추출된 미디어 정보 배열
 */
export function getMediaUrlsFromTweet(doc: Document | HTMLElement, tweetId: string): MediaInfo[] {
  const mediaItems: MediaInfo[] = [];
  let mediaIndex = 0;

  try {
    // document의 경우 documentElement를 사용
    const rootElement = doc instanceof Document ? doc.documentElement : doc;

    // ===== Phase 1: 비디오 미디어 우선 추출 (실제 video 요소) =====
    // 실제 비디오 요소를 먼저 추출하여 올바른 URL 사용
    const videos = cachedQuerySelectorAll('video', rootElement, 2000);

    if (videos && videos.length > 0) {
      Array.from(videos).forEach(video => {
        const videoElement = video as HTMLVideoElement;
        const mediaInfo = createMediaInfoFromVideo(videoElement, tweetId, mediaIndex);
        if (mediaInfo) {
          mediaItems.push(mediaInfo);
          mediaIndex++;
        }
      });
    }

    // ===== Phase 2: 이미지 미디어 추출 =====
    // 이미지 미디어 추출 (캐시된 조회 사용)
    // 1차 선택은 성능/범용성을 위해 substring 셀렉터를 사용하되,
    // 반드시 isTwitterMediaUrl()로 호스트명을 재검증한다(도메인 스푸핑 방지).
    const images = cachedQuerySelectorAll('img[src*="pbs.twimg.com"]', rootElement, 3000);
    if (images && images.length > 0) {
      for (const img of Array.from(images)) {
        const imgElement = img as HTMLImageElement;
        const src = imgElement.src;

        // 썸네일이나 프로필 이미지가 아닌 실제 미디어만 추출
        // 이모지 제외 (Phase 331)
        // 비디오 섬네일 제외 (Phase 332)
        if (
          !isTwitterMediaUrl(src) ||
          !src.includes('/media/') ||
          src.includes('profile_images') ||
          isEmojiUrl(src) ||
          isVideoThumbnailUrl(src)
        ) {
          continue;
        }

        // 일반 이미지 처리
        const mediaInfo = createMediaInfoFromImage(imgElement, tweetId, mediaIndex);
        if (mediaInfo) {
          mediaItems.push(mediaInfo);
          mediaIndex++;
        }
      }
    }

    // 추가: data-testid="tweetPhoto"와 data-testid="videoPlayer" 요소들도 확인 (캐시된 조회)
    const tweetPhotos = cachedQuerySelectorAll(SELECTORS.TWEET_PHOTO, rootElement, 3000);
    if (tweetPhotos && tweetPhotos.length > 0) {
      for (const photo of Array.from(tweetPhotos)) {
        const imgElement = cachedQuerySelector('img', photo as Element, 2000) as HTMLImageElement;
        if (!imgElement?.src || !isTwitterMediaUrl(imgElement.src)) {
          continue;
        }

        // 이모지 제외
        if (isEmojiUrl(imgElement.src)) {
          continue;
        }

        // 비디오 섬네일 제외 (Phase 332)
        if (isVideoThumbnailUrl(imgElement.src)) {
          continue;
        }

        // 일반 이미지 처리
        const mediaInfo = createMediaInfoFromImage(imgElement, tweetId, mediaIndex);
        if (mediaInfo && !mediaItems.some(item => item.url === mediaInfo.url)) {
          mediaItems.push(mediaInfo);
          mediaIndex++;
        }
      }
    }

    logger.debug(`getMediaUrlsFromTweet: ${mediaItems.length}개 미디어 추출됨 - ${tweetId}`);
    return mediaItems;
  } catch (error) {
    logger.error('getMediaUrlsFromTweet: 미디어 추출 실패:', error);
    return [];
  }
}

/**
 * 이미지 요소에서 MediaInfo 생성
 */
export function createMediaInfoFromImage(
  imgElement: HTMLImageElement,
  tweetId: string,
  index: number
): MediaInfo | null {
  try {
    const src = imgElement.src;
    const alt = imgElement.alt || `Media ${index + 1} from tweet`;

    // URL 유효성 검증
    if (!isValidMediaUrl(src)) {
      return null;
    }

    // 원본 URL 추출 (orig 버전으로 변경)
    const originalUrl = extractOriginalImageUrl(src);

    // 썸네일 URL (small 버전)
    const thumbnailUrl = `${src.replace(/[?&]name=[^&]*/, '').replace(/[?&]format=[^&]*/, '')}?format=jpg&name=small`;

    // 사용자/트윗 정보 기반 단일 소스 파일명 생성
    const username = getUsernameSafe() || undefined;
    const tempInfo: Partial<MediaInfo> = {
      id: `${tweetId}-${index}`,
      url: originalUrl,
      type: 'image',
      tweetId,
      tweetUsername: username,
    } as const;
    const filename = getFilename(
      tempInfo as MediaInfo,
      username
        ? {
            index: index + 1,
            // 서비스 표준 형식 유지를 위해 fallbackUsername도 전달
            fallbackUsername: username,
          }
        : { index: index + 1 }
    );

    return {
      id: `${tweetId}-${index}`,
      type: 'image',
      url: originalUrl,
      thumbnailUrl,
      originalUrl: `https://twitter.com/i/status/${tweetId}/photo/${index + 1}`,
      tweetId,
      filename,
      tweetUsername: getUsernameSafe() || undefined,
      tweetUrl: `https://twitter.com/i/status/${tweetId}`,
      alt,
      width: imgElement.width || 1200,
      height: imgElement.height || 800,
    };
  } catch (error) {
    logger.error('createMediaInfoFromImage: 이미지 정보 생성 실패:', error);
    return null;
  }
}

/**
 * 비디오 요소에서 MediaInfo 생성
 */
export function createMediaInfoFromVideo(
  videoElement: HTMLVideoElement,
  tweetId: string,
  index: number
): MediaInfo | null {
  try {
    const poster = videoElement.poster || '';
    const src = videoElement.src || videoElement.currentSrc || '';

    // 유효한 비디오 URL이 있는지 확인
    if (!src && !poster) {
      return null;
    }

    // 호스트 검증: video.twimg.com 또는 pbs.twimg.com(썸네일)만 허용
    const primary = src || poster;
    if (!isTwitterMediaUrl(primary)) {
      return null;
    }

    // Phase 330: 비디오 URL 최적화 (tag=12로 MP4 품질 보장)
    let optimizedVideoUrl = src;
    if (src && canExtractOriginalVideo(src)) {
      optimizedVideoUrl = extractOriginalVideoUrl(src);
      logger.debug('createMediaInfoFromVideo: 비디오 URL 최적화 (Phase 330)', {
        videoId: `${tweetId}-video-${index}`,
        original: src,
        optimized: optimizedVideoUrl,
        changed: src !== optimizedVideoUrl,
      });
    }

    // 사용자/트윗 정보 기반 단일 소스 파일명 생성
    const username = getUsernameSafe() || undefined;
    const tempInfo: Partial<MediaInfo> = {
      id: `${tweetId}-video-${index}`,
      url: optimizedVideoUrl || poster, // 최적화된 URL 또는 poster 사용
      type: 'video',
      tweetId,
      tweetUsername: username,
    } as const;
    // 확장자는 소스 URL에서 직접 우선 추출하여 서비스에 전달 (mp4 등의 정확성 보장)
    let ext: string | undefined;
    try {
      const sourceUrl = optimizedVideoUrl || poster; // 최적화된 URL에서 확장자 추출
      const m = sourceUrl.match(/\.([a-z0-9]+)(?:[?#]|$)/i);
      ext = m?.[1]?.toLowerCase();
    } catch {
      // ignore parse errors; fallback extension logic in FilenameService will apply
    }
    const options: { index: number } | { index: number; extension: string } = ext
      ? { index: index + 1, extension: ext }
      : { index: index + 1 };
    const filename = getFilename(
      tempInfo as MediaInfo,
      username
        ? ({ ...(options as FilenameOptions), fallbackUsername: username } as FilenameOptions)
        : (options as FilenameOptions)
    );

    return {
      id: `${tweetId}-video-${index}`,
      type: 'video',
      url: optimizedVideoUrl || poster, // 최적화된 비디오 URL 사용 (Phase 330)
      thumbnailUrl: poster,
      originalUrl: `https://twitter.com/i/status/${tweetId}/video/${index + 1}`,
      tweetId,
      filename,
      tweetUsername: getUsernameSafe() || undefined,
      tweetUrl: `https://twitter.com/i/status/${tweetId}`,
      alt: `Video ${index + 1} from tweet`,
      width: videoElement.videoWidth || 1920,
      height: videoElement.videoHeight || 1080,
    };
  } catch (error) {
    logger.error('createMediaInfoFromVideo: 비디오 정보 생성 실패:', error);
    return null;
  }
}

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
 * URL이 트위터 미디어 도메인에서 온 것인지 확인 (간단한 헬퍼)
 *
 * @param url - 검증할 URL
 * @returns 트위터 미디어 도메인 여부
 */
function isTwitterMediaUrl(url: string): boolean {
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

// ===== Media Filter Patterns (Cached Regex) =====
/**
 * Cached regex patterns for performance optimization
 * Phase 331-332: Emoji and video thumbnail filtering
 */
const MEDIA_FILTER_PATTERNS = {
  /** abs[-N].twimg.com hostname pattern for emoji CDN */
  EMOJI_HOSTNAME: /^abs(-\d+)?\.twimg\.com$/i,
  /** /emoji/v<N>/(svg|<size>) path pattern */
  EMOJI_PATH: /\/emoji\/v\d+\/(svg|\d+x\d+)\//i,
  /** Video thumbnail paths: amplify_video_thumb, ext_tw_video_thumb, tweet_video_thumb */
  VIDEO_THUMB_PATH:
    /\/(amplify_video_thumb|ext_tw_video_thumb|tweet_video_thumb|ad_img\/amplify_video)\//i,
} as const;

/**
 * Media type discriminator result
 */
export interface MediaTypeResult {
  /** Media type classification */
  type: 'image' | 'video' | 'emoji' | 'video-thumbnail' | 'unknown';
  /** Whether this media should be included in extraction */
  shouldInclude: boolean;
  /** Reason for filtering (if shouldInclude is false) */
  reason?: string;
  /** Validated hostname */
  hostname?: string;
}

/**
 * URL이 Twitter 이모지인지 판별
 *
 * 3-layer validation:
 * 1. 호스트명: abs[-N].twimg.com (CDN 분산)
 * 2. 경로: /emoji/ 포함
 * 3. 형식: /emoji/v<N>/<size|svg>/
 *
 * @param url - 검증할 URL
 * @returns 이모지 URL 여부
 *
 * @example
 * ```ts
 * isEmojiUrl('https://abs.twimg.com/emoji/v2/svg/1f600.svg') // true
 * isEmojiUrl('https://abs-0.twimg.com/emoji/v1/72x72/1f44d.png') // true
 * isEmojiUrl('https://pbs.twimg.com/media/ABC123?format=jpg') // false
 * ```
 */
export function isEmojiUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);

    // 1. 호스트 확인: abs[-N].twimg.com (이모지는 abs 서버에서 제공)
    if (!MEDIA_FILTER_PATTERNS.EMOJI_HOSTNAME.test(urlObj.hostname)) {
      return false;
    }

    // 2. 경로 확인: /emoji/ 포함 (이모지 경로 식별)
    if (!urlObj.pathname.includes('/emoji/')) {
      return false;
    }

    // 3. 형식 확인: /emoji/v<N>/(svg|<size>x<size>)/
    // 예: /emoji/v2/svg/, /emoji/v1/72x72/, /emoji/v2/36x36/
    return MEDIA_FILTER_PATTERNS.EMOJI_PATH.test(urlObj.pathname);
  } catch {
    return false;
  }
}

/**
 * URL이 Twitter 영상 섬네일인지 판별
 *
 * 2-layer validation:
 * 1. 호스트명: pbs.twimg.com
 * 2. 경로: /amplify_video_thumb/ 또는 /ext_tw_video_thumb/ 또는 /tweet_video_thumb/
 *
 * @param url - 검증할 URL
 * @returns 영상 섬네일 URL 여부
 *
 * @example
 * ```ts
 * isVideoThumbnailUrl('https://pbs.twimg.com/amplify_video_thumb/123/img/abc.jpg') // true
 * isVideoThumbnailUrl('https://pbs.twimg.com/ext_tw_video_thumb/456/img/def.jpg') // true
 * isVideoThumbnailUrl('https://pbs.twimg.com/media/ABC123?format=jpg') // false
 * ```
 */
export function isVideoThumbnailUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);

    // 1. 호스트 확인: pbs.twimg.com (섬네일 서버)
    if (urlObj.hostname !== 'pbs.twimg.com') {
      return false;
    }

    // 2. 경로 확인: video thumbnail 패턴 매칭
    // 예: /amplify_video_thumb/1931629000243453952/img/...
    //     /ext_tw_video_thumb/1234567890/img/...
    //     /tweet_video_thumb/1234567890/img/...
    //     /ad_img/amplify_video/1234567890/...
    return MEDIA_FILTER_PATTERNS.VIDEO_THUMB_PATH.test(urlObj.pathname);
  } catch {
    return false;
  }
}

/**
 * Comprehensive media type classifier
 *
 * Determines the exact type of media URL and whether it should be included in extraction.
 * This is the primary filter for media extraction workflows.
 *
 * @param url - Media URL to classify
 * @returns Classification result with inclusion recommendation
 *
 * @example
 * ```ts
 * classifyMediaUrl('https://pbs.twimg.com/media/ABC123?format=jpg&name=orig')
 * // { type: 'image', shouldInclude: true, hostname: 'pbs.twimg.com' }
 *
 * classifyMediaUrl('https://abs.twimg.com/emoji/v2/svg/1f600.svg')
 * // { type: 'emoji', shouldInclude: false, reason: 'Emoji URLs are filtered', ... }
 *
 * classifyMediaUrl('https://pbs.twimg.com/amplify_video_thumb/123/img/abc.jpg')
 * // { type: 'video-thumbnail', shouldInclude: false, reason: 'Video thumbnails are skipped (prefer video elements)', ... }
 * ```
 */
export function classifyMediaUrl(url: string): MediaTypeResult {
  if (!url || typeof url !== 'string') {
    return {
      type: 'unknown',
      shouldInclude: false,
      reason: 'Invalid URL: empty or non-string',
    };
  }

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // 1. Check for emoji (highest priority filter)
    if (isEmojiUrl(url)) {
      return {
        type: 'emoji',
        shouldInclude: false,
        reason: 'Emoji URLs are filtered (Phase 331)',
        hostname,
      };
    }

    // 2. Check for video thumbnail (second priority filter)
    if (isVideoThumbnailUrl(url)) {
      return {
        type: 'video-thumbnail',
        shouldInclude: false,
        reason: 'Video thumbnails are skipped (prefer video elements - Phase 332)',
        hostname,
      };
    }

    // 3. Classify valid media types
    if (hostname === 'video.twimg.com') {
      // Only include if it's a proper video path (/ext_tw_video/, /tweet_video/, etc.)
      if (urlObj.pathname.match(/\/(ext_tw_video|tweet_video|amplify_video)\//i)) {
        return {
          type: 'video',
          shouldInclude: true,
          hostname,
        };
      }
      // Unknown video path
      return {
        type: 'unknown',
        shouldInclude: false,
        reason: 'Unsupported video path pattern',
        hostname,
      };
    }

    if (hostname === 'pbs.twimg.com' && urlObj.pathname.includes('/media/')) {
      return {
        type: 'image',
        shouldInclude: true,
        hostname,
      };
    }

    // 4. Unknown or unsupported URL
    return {
      type: 'unknown',
      shouldInclude: false,
      reason: 'Unsupported hostname or path pattern',
      hostname,
    };
  } catch {
    return {
      type: 'unknown',
      shouldInclude: false,
      reason: 'URL parsing failed',
    };
  }
}

/**
 * Check if a URL should be included in media extraction
 *
 * Convenience wrapper around classifyMediaUrl for simple include/exclude decisions.
 *
 * @param url - Media URL to check
 * @returns true if URL should be included, false otherwise
 *
 * @example
 * ```ts
 * shouldIncludeMediaUrl('https://pbs.twimg.com/media/ABC?format=jpg') // true
 * shouldIncludeMediaUrl('https://abs.twimg.com/emoji/v2/svg/1f600.svg') // false
 * shouldIncludeMediaUrl('https://pbs.twimg.com/amplify_video_thumb/123/img/abc.jpg') // false
 * ```
 */
export function shouldIncludeMediaUrl(url: string): boolean {
  return classifyMediaUrl(url).shouldInclude;
}

/**
 * 영상 섬네일 URL에서 video ID 추출
 *
 * @param url - 영상 섬네일 URL
 * @returns video ID (예: "1931629000243453952") 또는 null
 */
export function extractVideoIdFromThumbnail(url: string): string | null {
  if (!isVideoThumbnailUrl(url)) {
    return null;
  }

  try {
    // 경로 예: /amplify_video_thumb/1931629000243453952/img/wzXQeHFbVbPENOya
    // video ID는 두 번째 경로 세그먼트
    const urlObj = new URL(url);
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

/**
 * 미디어 URL이 유효한지 검증
 *
 * @param url - 검증할 URL
 * @returns 유효성 여부
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

    // 프로토콜 검증 - https 또는 http만 허용
    if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
      return false;
    }

    // 도메인별 경로 검증
    if (urlObj.hostname === 'pbs.twimg.com') {
      // pbs.twimg.com은 /media/ 또는 video thumbnail 경로를 포함해야 하고, profile_images는 제외
      const path = urlObj.pathname;
      const isMedia = path.includes('/media/');
      const isVideoThumb =
        /\/ext_tw_video_thumb\//.test(path) ||
        /\/tweet_video_thumb\//.test(path) ||
        /\/video_thumb\//.test(path);
      return (isMedia || isVideoThumb) && !path.includes('/profile_images/');
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
 * URL 생성자를 사용할 수 없는 환경에서의 fallback 검증 함수
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
 * 미디어 URL에서 고품질 버전 생성
 *
 * @param url - 원본 URL
 * @param quality - 품질 설정 ('large' | 'medium' | 'small')
 * @returns 고품질 URL
 */
export function getHighQualityMediaUrl(
  url: string,
  quality: 'large' | 'medium' | 'small' = 'large'
): string {
  // 입력값 검증 - null/undefined 처리
  if (!url || typeof url !== 'string') {
    return url || '';
  }

  try {
    // URL 생성자를 안전하게 시도
    let URLConstructor: typeof URL | undefined;

    if (typeof globalThis !== 'undefined' && typeof globalThis.URL === 'function') {
      URLConstructor = globalThis.URL;
    } else if (typeof window !== 'undefined' && typeof window.URL === 'function') {
      URLConstructor = window.URL;
    }

    if (!URLConstructor) {
      return getHighQualityMediaUrlFallback(url, quality);
    }

    const urlObj = new URLConstructor(url);
    urlObj.searchParams.set('name', quality);
    if (!urlObj.searchParams.has('format')) {
      urlObj.searchParams.set('format', 'jpg');
    }
    return urlObj.toString();
  } catch {
    return getHighQualityMediaUrlFallback(url, quality);
  }
}

/**
 * URL 생성자 없이 품질 변환하는 fallback 함수
 */
function getHighQualityMediaUrlFallback(
  url: string,
  quality: 'large' | 'medium' | 'small' = 'large'
): string {
  // 입력값 검증
  if (!url || typeof url !== 'string') {
    return url;
  }

  // 기본적인 URL 유효성 검사 - 프로토콜이 있어야 함
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url;
  }

  // 기존 name 파라미터 제거 및 새 품질로 교체
  const processedUrl = url.replace(/[?&]name=[^&]*/, '');

  // 쿼리 파라미터 파싱을 위한 기본 처리
  const hasQuery = processedUrl.includes('?');
  const baseUrl = hasQuery ? processedUrl.split('?')[0] : processedUrl;
  const existingParams = hasQuery ? processedUrl.split('?')[1] : '';

  // 새로운 파라미터 배열 구성
  const params = [];

  // name 파라미터 먼저 추가 (테스트 기대값과 일치)
  params.push(`name=${quality}`);

  // 기존 파라미터들 중 name이 아닌 것들 추가
  if (existingParams) {
    const existingParamPairs = existingParams
      .split('&')
      .filter(param => param && !param.startsWith('name='));
    params.push(...existingParamPairs);
  }

  // format 파라미터가 없으면 추가
  if (!params.some(p => p.startsWith('format='))) {
    params.push('format=jpg');
  }

  return `${baseUrl}?${params.join('&')}`;
}

// ===== helpers to access services via container (no direct service imports in utils) =====
function getUsernameSafe(): string | null {
  // 우선 media 레이어 헬퍼 사용 (테스트에서 모킹 용이)
  try {
    const viaMedia = getPreferredUsername();
    if (viaMedia) return viaMedia;
  } catch {
    // noop
  }
  return null;
}

function getFilename(info: MediaInfo, options: FilenameOptions): string {
  try {
    const service = getMediaFilenameService();
    return service.generateMediaFilename(info, options);
  } catch {
    // minimal fallback: synthesize simple filename
    const base = info.tweetId ? `${info.tweetId}` : 'media';
    const idx = (options.index ?? 1).toString().padStart(2, '0');
    const ext = options.extension ? `.${options.extension}` : '';
    return `${base}_${idx}${ext}`;
  }
}

/**
 * 파일명을 안전하게 정리 (확장자 중복 제거, 특수문자 처리)
 *
 * @param filename - 원본 파일명
 * @returns 정리된 파일명
 */
export function cleanFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'media';
  }

  // 기본 정리: 공백 제거, 소문자화
  let cleaned = filename.trim();

  // 이미 확장자가 있으면 제거 (이미지/비디오 확장자)
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi'];
  const allExtensions = [...imageExtensions, ...videoExtensions];

  for (const ext of allExtensions) {
    if (cleaned.toLowerCase().endsWith(ext)) {
      cleaned = cleaned.slice(0, -ext.length);
      break;
    }
  }

  // 파일명이 비어있으면 기본값 반환
  if (!cleaned) {
    return 'media';
  }

  // 특수문자 제거 (파일시스템 안전성)
  cleaned = cleaned.replace(/[<>:"/\\|?*]/g, '_');

  // 길이 제한 (255자는 대부분 파일시스템의 제한)
  if (cleaned.length > 200) {
    cleaned = cleaned.substring(0, 200);
  }

  return cleaned;
}

/**
 * 미디어 ID 추출 (video thumbnail URL 지원)
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
