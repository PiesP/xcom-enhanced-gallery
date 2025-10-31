/**
 * @fileoverview Video Utilities
 * @description Twitter 비디오 관련 유틸리티 함수들
 * @version 1.0.0 - Phase 291: TwitterVideoExtractor 분할
 */

import { STABLE_SELECTORS } from '@/constants';
import { logger } from '@shared/logging';
import type { TweetMediaEntry } from './types';

/**
 * 이미지 요소가 비디오 썸네일인지 확인
 */
export function isVideoThumbnail(imgElement: HTMLImageElement): boolean {
  const src = imgElement.src;
  const alt = imgElement.alt;
  return (
    src.includes('ext_tw_video_thumb') ||
    src.includes('amplify_video_thumb') ||
    src.includes('tweet_video_thumb') ||
    alt === 'Animated Text GIF' ||
    alt === 'Embedded video' ||
    imgElement.closest(STABLE_SELECTORS.MEDIA_PLAYERS.join(', ')) !== null ||
    imgElement.closest('a[aria-label*="video"]') !== null ||
    imgElement.closest('a[aria-label*="Video"]') !== null ||
    imgElement.closest('a[aria-label="Embedded video"]') !== null
  );
}

/**
 * 요소가 비디오 플레이어인지 확인
 */
export function isVideoPlayer(element: HTMLElement): boolean {
  return (
    element.tagName === 'VIDEO' ||
    element.closest(STABLE_SELECTORS.MEDIA_PLAYERS.join(', ')) !== null ||
    element.closest('div[role="img"][aria-label*="video"]') !== null ||
    element.closest('div[role="img"][aria-label*="Video"]') !== null
  );
}

/**
 * 요소가 비디오 요소(썸네일 또는 플레이어)인지 확인
 */
export function isVideoElement(element: HTMLElement): boolean {
  if (element.tagName === 'IMG') {
    return isVideoThumbnail(element as HTMLImageElement);
  }
  return isVideoPlayer(element);
}

/**
 * URL에서 트윗 ID 추출
 */
export function extractTweetId(url: string): string | null {
  const match = url.match(/(?<=\/status\/)\d+/);
  return match?.[0] ?? null;
}

/**
 * 컨테이너에서 트윗 ID 추출
 */
export function getTweetIdFromContainer(container: HTMLElement): string | null {
  const links = container.querySelectorAll('a[href*="/status/"], time');
  for (const element of links) {
    let href: string | null = null;
    if (element.tagName === 'A') {
      href = (element as HTMLAnchorElement).href;
    } else if (element.tagName === 'TIME') {
      const parentLink = element.closest('a[href*="/status/"]');
      if (parentLink) href = (parentLink as HTMLAnchorElement).href;
    }
    if (href) {
      if (href.startsWith('/')) href = `https://x.com${href}`;
      const tweetId = extractTweetId(href);
      if (tweetId) return tweetId;
    }
  }
  const dataElements = container.querySelectorAll('[data-tweet-id], [aria-label]');
  for (const element of dataElements) {
    const dataTweetId = element.getAttribute('data-tweet-id');
    if (dataTweetId && /^\d{15,20}$/.test(dataTweetId)) return dataTweetId;
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      const match = ariaLabel.match(/\b(\d{15,20})\b/);
      if (match?.[1]) return match[1];
    }
  }
  const textContent = container.textContent ?? '';
  const textMatch = textContent.match(/\b(\d{15,20})\b/);
  if (textMatch?.[1]) return textMatch[1];
  if (window.location.pathname.includes('/status/')) {
    return extractTweetId(window.location.href);
  }
  return null;
}

/**
 * 트윗 ID로 비디오 미디어 엔트리 가져오기
 */
export async function getVideoMediaEntry(
  getTweetMedias: (tweetId: string) => Promise<TweetMediaEntry[]>,
  tweetId: string,
  thumbnailUrl?: string
): Promise<TweetMediaEntry | null> {
  try {
    const medias = await getTweetMedias(tweetId);
    const videoMedias = medias.filter(media => media.type === 'video');
    if (videoMedias.length === 0) return null;
    if (thumbnailUrl) {
      const normalizedThumbnail = thumbnailUrl.replace(/\?.*$/, '');
      const matchedVideo = videoMedias.find(media =>
        media.preview_url.startsWith(normalizedThumbnail)
      );
      if (matchedVideo) return matchedVideo;
    }
    return videoMedias[0] ?? null;
  } catch (error) {
    logger.error('Failed to get video media entry:', error);
    return null;
  }
}

/**
 * 썸네일 이미지에서 비디오 URL 추출
 */
export async function getVideoUrlFromThumbnail(
  getTweetMedias: (tweetId: string) => Promise<TweetMediaEntry[]>,
  imgElement: HTMLImageElement,
  tweetContainer: HTMLElement
): Promise<string | null> {
  if (!isVideoThumbnail(imgElement)) return null;
  const tweetId = getTweetIdFromContainer(tweetContainer);
  if (!tweetId) {
    logger.warn('Cannot extract tweet ID from container');
    return null;
  }
  const videoEntry = await getVideoMediaEntry(getTweetMedias, tweetId, imgElement.src);
  return videoEntry?.download_url ?? null;
}
