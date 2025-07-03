/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * Media URL Utility
 *
 * 트윗에서 실제 미디어 URL을 추출하는 유틸리티 함수들
 * BackgroundTweetLoader와 함께 사용되어 정확한 미디어 정보를 제공합니다.
 */

import { logger } from '../../../infrastructure/logging/logger';
import { extractUsername } from './username-extraction';
import type { MediaInfo } from '../../types/media.types';

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

    // 이미지 미디어 추출
    const images = rootElement.querySelectorAll('img[src*="pbs.twimg.com"]');
    images.forEach(img => {
      const imgElement = img as HTMLImageElement;
      const src = imgElement.src;

      // 썸네일이나 프로필 이미지가 아닌 실제 미디어만 추출
      if (src.includes('/media/') && !src.includes('profile_images')) {
        const mediaInfo = createMediaInfoFromImage(imgElement, tweetId, mediaIndex);
        if (mediaInfo) {
          mediaItems.push(mediaInfo);
          mediaIndex++;
        }
      }
    });

    // 비디오 미디어 추출
    const videos = rootElement.querySelectorAll('video');
    videos.forEach(video => {
      const mediaInfo = createMediaInfoFromVideo(video, tweetId, mediaIndex);
      if (mediaInfo) {
        mediaItems.push(mediaInfo);
        mediaIndex++;
      }
    });

    // 추가: data-testid="tweetPhoto"와 data-testid="videoPlayer" 요소들도 확인
    const tweetPhotos = rootElement.querySelectorAll('[data-testid="tweetPhoto"]');
    tweetPhotos.forEach(photo => {
      const imgElement = photo.querySelector('img') as HTMLImageElement;
      if (imgElement?.src?.includes('pbs.twimg.com')) {
        const mediaInfo = createMediaInfoFromImage(imgElement, tweetId, mediaIndex);
        if (mediaInfo && !mediaItems.some(item => item.url === mediaInfo.url)) {
          mediaItems.push(mediaInfo);
          mediaIndex++;
        }
      }
    });

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
function createMediaInfoFromImage(
  imgElement: HTMLImageElement,
  tweetId: string,
  index: number
): MediaInfo | null {
  try {
    const src = imgElement.src;
    const alt = imgElement.alt || `Media ${index + 1} from tweet`;

    // 원본 URL 추출 (large 버전)
    const originalUrl = `${src.replace(/[?&]name=[^&]*/, '').replace(/[?&]format=[^&]*/, '')}?format=jpg&name=large`;

    // 썸네일 URL (small 버전)
    const thumbnailUrl = `${src.replace(/[?&]name=[^&]*/, '').replace(/[?&]format=[^&]*/, '')}?format=jpg&name=small`;

    // 파일명 추출 (URL에서 실제 미디어 ID 부분)
    const urlMatch = src.match(/\/media\/([^?]+)/);
    const mediaId = urlMatch ? urlMatch[1] : `${tweetId}_media_${index}`;
    const filename = `${mediaId}.jpg`;

    return {
      id: `${tweetId}-${index}`,
      type: 'image',
      url: originalUrl,
      thumbnailUrl,
      originalUrl: `https://twitter.com/i/status/${tweetId}/photo/${index + 1}`,
      tweetId,
      filename,
      tweetUsername: extractUsername() || undefined,
      tweetUrl: `https://twitter.com/i/status/${tweetId}`,
      alt,
    };
  } catch (error) {
    logger.error('createMediaInfoFromImage: 이미지 정보 생성 실패:', error);
    return null;
  }
}

/**
 * 비디오 요소에서 MediaInfo 생성
 */
function createMediaInfoFromVideo(
  videoElement: HTMLVideoElement,
  tweetId: string,
  index: number
): MediaInfo | null {
  try {
    const poster = videoElement.poster || '';
    const src = videoElement.src || videoElement.currentSrc || '';

    // 비디오 썸네일 (poster)에서 미디어 ID 추출
    const posterMatch = poster.match(/\/media\/([^?]+)/);
    const mediaId = posterMatch ? posterMatch[1] : `${tweetId}_video_${index}`;
    const filename = `${mediaId}.mp4`;

    return {
      id: `${tweetId}-video-${index}`,
      type: 'video',
      url: src || poster, // 실제 비디오 URL이 없으면 poster 사용
      thumbnailUrl: poster,
      originalUrl: `https://twitter.com/i/status/${tweetId}/video/${index + 1}`,
      tweetId,
      filename,
      tweetUsername: extractUsername() || undefined,
      tweetUrl: `https://twitter.com/i/status/${tweetId}`,
      alt: `Video ${index + 1} from tweet`,
    };
  } catch (error) {
    logger.error('createMediaInfoFromVideo: 비디오 정보 생성 실패:', error);
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
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname === 'pbs.twimg.com' ||
      urlObj.hostname === 'video.twimg.com' ||
      urlObj.pathname.includes('/media/')
    );
  } catch {
    return false;
  }
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
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('name', quality);
    if (!urlObj.searchParams.has('format')) {
      urlObj.searchParams.set('format', 'jpg');
    }
    return urlObj.toString();
  } catch {
    return url;
  }
}
