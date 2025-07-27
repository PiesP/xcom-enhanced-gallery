/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * Media URL Utility
 *
 * 트윗에서 실제 미디어 URL을 추출하는 유틸리티 함수들
 * BackgroundTweetLoader와 함께 사용되어 정확한 미디어 정보를 제공합니다.
 */

import { logger } from '@shared/logging/logger';
import { parseUsernameFast } from '@shared/services/media/UsernameExtractionService';
import type { MediaInfo } from '@shared/types/media.types';
import { cachedQuerySelector, cachedQuerySelectorAll } from '@shared/dom';

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

    // 이미지 미디어 추출 (캐시된 조회 사용)
    const images = cachedQuerySelectorAll('img[src*="pbs.twimg.com"]', rootElement, 3000);
    if (images && images.length > 0) {
      Array.from(images).forEach(img => {
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
    }

    // 비디오 미디어 추출 (캐시된 조회 사용)
    const videos = cachedQuerySelectorAll('video', rootElement, 2000);
    if (videos && videos.length > 0) {
      Array.from(videos).forEach(video => {
        const mediaInfo = createMediaInfoFromVideo(video as HTMLVideoElement, tweetId, mediaIndex);
        if (mediaInfo) {
          mediaItems.push(mediaInfo);
          mediaIndex++;
        }
      });
    }

    // 추가: data-testid="tweetPhoto"와 data-testid="videoPlayer" 요소들도 확인 (캐시된 조회)
    const tweetPhotos = cachedQuerySelectorAll('[data-testid="tweetPhoto"]', rootElement, 3000);
    if (tweetPhotos && tweetPhotos.length > 0) {
      Array.from(tweetPhotos).forEach(photo => {
        const imgElement = cachedQuerySelector('img', photo as Element, 2000) as HTMLImageElement;
        if (imgElement?.src?.includes('pbs.twimg.com')) {
          const mediaInfo = createMediaInfoFromImage(imgElement, tweetId, mediaIndex);
          if (mediaInfo && !mediaItems.some(item => item.url === mediaInfo.url)) {
            mediaItems.push(mediaInfo);
            mediaIndex++;
          }
        }
      });
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

    // 파일명 추출 (URL에서 실제 미디어 ID 부분)
    const urlMatch = src.match(/\/media\/([^?]+)/);
    const mediaId = urlMatch?.[1] ?? `media_${tweetId}_${index}`;

    // 안전한 파일명 생성 - 중복 확장자 제거 및 유효성 검증
    const cleanMediaId = cleanFilename(mediaId);
    const filename = `${cleanMediaId}.jpg`;

    return {
      id: `${tweetId}-${index}`,
      type: 'image',
      url: originalUrl,
      thumbnailUrl,
      originalUrl: `https://twitter.com/i/status/${tweetId}/photo/${index + 1}`,
      tweetId,
      filename,
      tweetUsername: parseUsernameFast() || undefined,
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

    // 비디오 썸네일 (poster)에서 미디어 ID 추출
    const posterMatch = poster.match(/\/media\/([^?]+)/);
    const mediaId = posterMatch ? posterMatch[1] : `video_${tweetId}_${index}`;

    // 안전한 파일명 생성
    const cleanMediaId = cleanFilename(mediaId ?? `fallback_${tweetId}_${index}`);
    const filename = `${cleanMediaId}.mp4`;

    return {
      id: `${tweetId}-video-${index}`,
      type: 'video',
      url: src || poster, // 실제 비디오 URL이 없으면 poster 사용
      thumbnailUrl: poster,
      originalUrl: `https://twitter.com/i/status/${tweetId}/video/${index + 1}`,
      tweetId,
      filename,
      tweetUsername: parseUsernameFast() || undefined,
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
 * @param url - 원본 이미지 URL
 * @returns 원본 고화질 URL
 */
export function extractOriginalImageUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // 이미 orig가 설정되어 있으면 그대로 반환
    if (urlObj.searchParams.get('name') === 'orig') {
      return url;
    }

    // name 파라미터를 orig로 설정
    urlObj.searchParams.set('name', 'orig');

    return urlObj.toString();
  } catch {
    // URL 파싱 실패 시 기본 orig 파라미터 추가
    if (url.includes('?')) {
      return `${url.replace(/[?&]name=[^&]*/, '')}&name=orig`;
    } else {
      return `${url}?name=orig`;
    }
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
      // pbs.twimg.com은 /media/ 경로를 포함해야 하고, profile_images는 제외
      return urlObj.pathname.includes('/media/') && !urlObj.pathname.includes('/profile_images/');
    }

    if (urlObj.hostname === 'video.twimg.com') {
      // video.twimg.com은 모든 경로 허용
      return true;
    }

    // 기타 도메인은 허용하지 않음 (Twitter 미디어만)
    return false;
  } catch (error) {
    // URL 생성이 실패하면 fallback 사용
    console.warn('URL parsing failed, using fallback:', error);
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

  // 지원하지 않는 트위터 서브도메인 명시적 거부
  if (url.includes('ton.twimg.com')) {
    return false;
  }

  // 도메인 스푸핑 방지: 정확한 호스트명 매칭
  const protocolRegex = /^https?:\/\/([^/]+)/;
  const match = url.match(protocolRegex);
  if (!match) {
    return false;
  }

  const hostname = match[1];

  // 트위터 미디어 도메인 정확한 검사
  if (hostname === 'pbs.twimg.com') {
    return url.includes('/media/') && !url.includes('/profile_images/');
  }

  if (hostname === 'video.twimg.com') {
    return true;
  }

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
