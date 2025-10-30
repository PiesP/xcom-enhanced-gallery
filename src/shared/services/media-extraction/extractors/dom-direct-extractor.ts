/**
 * @fileoverview DOM 추출기 (백업 전략용)
 * @description 기본적인 DOM 파싱을 수행하는 백업 추출기
 * @version 3.0.0 - Clean Architecture
 */

import { logger } from '@shared/logging';
import { extractOriginalImageUrl, isValidMediaUrl } from '@shared/utils/media/media-url.util';
import { createSelectorRegistry } from '@shared/dom';
import { STABLE_SELECTORS } from '@/constants';
import type { MediaExtractionOptions, TweetInfo } from '@shared/types/media.types';
import type { MediaExtractionResult, MediaInfo } from '@shared/types/media.types';

type DimensionPair = { width: number; height: number };

const DIMENSION_PATTERN = /\/(\d{2,6})x(\d{2,6})\//;

const parsePositiveNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
};

const extractDimensionsFromUrl = (url: string | null | undefined): DimensionPair | null => {
  if (!url) {
    return null;
  }

  const match = url.match(DIMENSION_PATTERN);
  if (!match) {
    return null;
  }

  const width = Number.parseInt(match[1] ?? '', 10);
  const height = Number.parseInt(match[2] ?? '', 10);

  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    return null;
  }

  return { width, height };
};

const resolveImageDimensions = (element: HTMLImageElement, url: string): DimensionPair | null => {
  const naturalWidth = parsePositiveNumber(element.naturalWidth);
  const naturalHeight = parsePositiveNumber(element.naturalHeight);

  if (naturalWidth && naturalHeight) {
    return { width: naturalWidth, height: naturalHeight };
  }

  const attributeWidth = parsePositiveNumber(element.getAttribute('width'));
  const attributeHeight = parsePositiveNumber(element.getAttribute('height'));

  if (attributeWidth && attributeHeight) {
    return { width: attributeWidth, height: attributeHeight };
  }

  const styleWidth = parsePositiveNumber(element.style.width?.replace(/[^0-9.]/g, ''));
  const styleHeight = parsePositiveNumber(element.style.height?.replace(/[^0-9.]/g, ''));

  if (styleWidth && styleHeight) {
    return { width: styleWidth, height: styleHeight };
  }

  return extractDimensionsFromUrl(url);
};

const resolveVideoDimensions = (element: HTMLVideoElement, url: string): DimensionPair | null => {
  const videoWidth = parsePositiveNumber(element.videoWidth);
  const videoHeight = parsePositiveNumber(element.videoHeight);

  if (videoWidth && videoHeight) {
    return { width: videoWidth, height: videoHeight };
  }

  const attributeWidth = parsePositiveNumber(element.getAttribute('width'));
  const attributeHeight = parsePositiveNumber(element.getAttribute('height'));

  if (attributeWidth && attributeHeight) {
    return { width: attributeWidth, height: attributeHeight };
  }

  return extractDimensionsFromUrl(url);
};

/**
 * DOM 추출기 (백업 전략용)
 * 기본적인 DOM 파싱 수행
 */
export class DOMDirectExtractor {
  private readonly selectors = createSelectorRegistry();
  /**
   * DOM에서 직접 미디어 추출
   */
  async extract(
    element: HTMLElement,
    _options: MediaExtractionOptions,
    extractionId: string,
    tweetInfo?: TweetInfo
  ): Promise<MediaExtractionResult> {
    logger.debug(`[DOMDirectExtractor] ${extractionId}: DOM 직접 추출 시작`);

    const container = this.findMediaContainer(element);
    if (!container) {
      return this.createFailureResult('컨테이너를 찾을 수 없음');
    }

    const mediaItems = this.extractMediaFromContainer(container, tweetInfo);
    const clickedIndex = this.findClickedIndex(element, mediaItems);

    if (mediaItems.length === 0) {
      return this.createFailureResult('미디어를 찾을 수 없음');
    }

    logger.info(
      `[DOMDirectExtractor] ${extractionId}: ✅ DOM 추출 성공 - ${mediaItems.length}개 미디어`
    );

    return {
      success: true,
      mediaItems,
      clickedIndex,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'dom-direct',
        strategy: 'dom-fallback',
      },
      tweetInfo: tweetInfo ?? null,
    };
  }

  /**
   * 미디어 컨테이너 찾기 (단순화된 로직)
   */
  private findMediaContainer(element: HTMLElement): HTMLElement | null {
    // 우선 가장 가까운 상위 트윗 컨테이너를 우선 선택
    const closestTweet = this.selectors.findClosest(STABLE_SELECTORS.TWEET_CONTAINERS, element);
    if (closestTweet) return closestTweet as HTMLElement;

    // fallback: 기존 우선순위로 탐색
    const first = this.selectors.findTweetContainer(element) || this.selectors.findTweetContainer();
    return (first as HTMLElement) || element;
  }

  /**
   * 컨테이너에서 미디어 추출
   */
  private extractMediaFromContainer(container: HTMLElement, tweetInfo?: TweetInfo): MediaInfo[] {
    const mediaItems: MediaInfo[] = [];

    // 이미지 추출
    const images = container.querySelectorAll('img[src]');
    images.forEach((img, index) => {
      const imgElement = img as HTMLImageElement;
      if (this.isValidImageUrl(imgElement.src)) {
        const originalUrl = extractOriginalImageUrl(imgElement.src);
        if (originalUrl) {
          mediaItems.push(this.createImageMediaInfo(imgElement, originalUrl, index, tweetInfo));
        }
      }
    });

    // 비디오 추출
    const videos = container.querySelectorAll('video[src*="video.twimg.com"]');
    videos.forEach((video, _index) => {
      const videoElement = video as HTMLVideoElement;
      if (videoElement.src) {
        mediaItems.push(
          this.createVideoMediaInfo(videoElement, videoElement.src, mediaItems.length, tweetInfo)
        );
      }
    });

    return mediaItems;
  }

  /**
   * 이미지 MediaInfo 생성
   */
  private createImageMediaInfo(
    element: HTMLImageElement,
    url: string,
    index: number,
    tweetInfo?: TweetInfo
  ): MediaInfo {
    const dimensions = resolveImageDimensions(element, url);

    const metadata = dimensions
      ? {
          dimensions,
        }
      : undefined;

    return {
      id: `img_${Date.now()}_${index}`,
      url,
      type: 'image',
      originalUrl: url,
      filename: this.generateFilename('image', index, tweetInfo),
      tweetId: tweetInfo?.tweetId,
      tweetUsername: tweetInfo?.username,
      ...(dimensions && { width: dimensions.width, height: dimensions.height }),
      ...(metadata && { metadata }),
    };
  }

  /**
   * 비디오 MediaInfo 생성
   */
  private createVideoMediaInfo(
    element: HTMLVideoElement,
    url: string,
    index: number,
    tweetInfo?: TweetInfo
  ): MediaInfo {
    const dimensions = resolveVideoDimensions(element, url);

    const metadata = dimensions
      ? {
          dimensions,
        }
      : undefined;

    return {
      id: `vid_${Date.now()}_${index}`,
      url,
      type: 'video',
      originalUrl: url,
      filename: this.generateFilename('video', index, tweetInfo),
      thumbnailUrl: this.generateVideoThumbnail(url),
      tweetId: tweetInfo?.tweetId,
      tweetUsername: tweetInfo?.username,
      ...(dimensions && { width: dimensions.width, height: dimensions.height }),
      ...(metadata && { metadata }),
    };
  }

  /**
   * 파일명 생성
   */
  private generateFilename(type: string, index: number, tweetInfo?: TweetInfo): string {
    const extension = type === 'image' ? 'jpg' : 'mp4';
    const prefix = tweetInfo?.username ? `${tweetInfo.username}_` : '';
    const tweetSuffix = tweetInfo?.tweetId ? `_${tweetInfo.tweetId}` : '';
    return `${prefix}media_${index + 1}${tweetSuffix}.${extension}`;
  }

  /**
   * 비디오 썸네일 생성
   */
  private generateVideoThumbnail(videoUrl: string): string {
    return videoUrl.replace(/\.mp4.*$/, '.jpg');
  }

  /**
   * 유효한 이미지 URL 검사
   */
  private isValidImageUrl(url: string): boolean {
    return isValidMediaUrl(url);
  }

  /**
   * 클릭된 미디어 인덱스 찾기
   */
  private findClickedIndex(clickedElement: HTMLElement, mediaItems: MediaInfo[]): number {
    if (clickedElement.tagName === 'IMG') {
      const imgSrc = (clickedElement as HTMLImageElement).src;
      const index = mediaItems.findIndex(
        item => item.url.includes(imgSrc.split('?')[0]!) || imgSrc.includes(item.url.split('?')[0]!)
      );
      return Math.max(0, index);
    }

    if (clickedElement.tagName === 'VIDEO') {
      const videoSrc = (clickedElement as HTMLVideoElement).src;
      const index = mediaItems.findIndex(item => item.url.includes(videoSrc));
      return Math.max(0, index);
    }

    // 기본적으로 첫 번째 미디어 반환
    return 0;
  }

  /**
   * 실패 결과 생성
   */
  private createFailureResult(reason: string): MediaExtractionResult {
    return {
      success: false,
      mediaItems: [],
      clickedIndex: 0,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'dom-direct',
        strategy: 'dom-fallback-failed',
        error: reason,
      },
      tweetInfo: null,
    };
  }
}
