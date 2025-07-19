/**
 * @fileoverview 통합 미디어 추출기
 * @version 3.0.0
 *
 * 모든 미디어 추출 전략을 하나로 통합하여 중복을 제거하고
 * 일관성 있는 미디어 추출을 보장합니다.
 */

import { logger } from '@core/logging/logger';
import { parseUsernameFast } from '@core/services/media/UsernameExtractionService';
import type { MediaInfo } from '@core/types/media.types';
import type {
  TweetInfo,
  MediaExtractionResult,
  FallbackExtractionStrategy,
} from './interfaces/extraction.interfaces';

/**
 * 통합 미디어 추출기
 *
 * 모든 fallback 전략을 순차적으로 시도하는 통합 클래스
 */
export class MediaExtractor implements FallbackExtractionStrategy {
  readonly name = 'media-extractor';

  async extract(
    tweetContainer: HTMLElement,
    clickedElement: HTMLElement,
    tweetInfo?: TweetInfo
  ): Promise<MediaExtractionResult> {
    try {
      const mediaItems: MediaInfo[] = [];
      let clickedIndex = 0;

      // 1. 이미지 요소에서 추출
      const imageItems = this.extractFromImages(tweetContainer, clickedElement, tweetInfo);
      if (imageItems.clickedIndex >= 0) {
        clickedIndex = mediaItems.length + imageItems.clickedIndex;
      }
      mediaItems.push(...imageItems.items);

      // 2. 비디오 요소에서 추출
      const videoItems = this.extractFromVideos(tweetContainer, clickedElement, tweetInfo);
      if (videoItems.clickedIndex >= 0 && clickedIndex === 0) {
        clickedIndex = mediaItems.length + videoItems.clickedIndex;
      }
      mediaItems.push(...videoItems.items);

      // 3. 데이터 속성에서 추출
      const dataItems = this.extractFromDataAttributes(tweetContainer, clickedElement, tweetInfo);
      if (dataItems.clickedIndex >= 0 && clickedIndex === 0) {
        clickedIndex = mediaItems.length + dataItems.clickedIndex;
      }
      mediaItems.push(...dataItems.items);

      // 4. 배경 이미지에서 추출
      const backgroundItems = this.extractFromBackgroundImages(
        tweetContainer,
        clickedElement,
        tweetInfo
      );
      if (backgroundItems.clickedIndex >= 0 && clickedIndex === 0) {
        clickedIndex = mediaItems.length + backgroundItems.clickedIndex;
      }
      mediaItems.push(...backgroundItems.items);

      return {
        success: mediaItems.length > 0,
        mediaItems,
        clickedIndex,
        metadata: {
          extractedAt: Date.now(),
          sourceType: 'extractor',
          strategy: 'media-extractor',
        },
        tweetInfo: tweetInfo ?? null,
      };
    } catch (error) {
      logger.error('[MediaExtractor] 추출 오류:', error);
      return {
        success: false,
        mediaItems: [],
        clickedIndex: 0,
        metadata: {
          extractedAt: Date.now(),
          sourceType: 'extractor',
          strategy: 'media-extractor-failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        tweetInfo: tweetInfo ?? null,
      };
    }
  }

  /**
   * 이미지 요소에서 미디어 추출
   */
  private extractFromImages(
    tweetContainer: HTMLElement,
    clickedElement: HTMLElement,
    tweetInfo?: TweetInfo
  ): { items: MediaInfo[]; clickedIndex: number } {
    const images = tweetContainer.querySelectorAll('img');
    const items: MediaInfo[] = [];
    let clickedIndex = -1;

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (!img) continue;

      const src = img.getAttribute('src');
      if (!src || !this.isValidImageUrl(src)) continue;

      // 클릭된 요소 확인
      if (img === clickedElement || clickedElement.contains(img) || img.contains(clickedElement)) {
        clickedIndex = items.length;
      }

      const mediaInfo: MediaInfo = {
        id: `img_${i}`,
        url: src,
        type: 'image',
        filename: '',
        tweetUsername: tweetInfo?.username || parseUsernameFast() || undefined,
        tweetId: tweetInfo?.tweetId || undefined,
        tweetUrl: tweetInfo?.tweetUrl || '',
        originalUrl: src,
        thumbnailUrl: src,
        alt: img.getAttribute('alt') || `Image ${i + 1}`,
        metadata: {
          source: 'img-element',
        },
      };

      items.push(mediaInfo);
    }

    return { items, clickedIndex };
  }

  /**
   * 비디오 요소에서 미디어 추출
   */
  private extractFromVideos(
    tweetContainer: HTMLElement,
    clickedElement: HTMLElement,
    tweetInfo?: TweetInfo
  ): { items: MediaInfo[]; clickedIndex: number } {
    const videos = tweetContainer.querySelectorAll('video');
    const items: MediaInfo[] = [];
    let clickedIndex = -1;

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      if (!video) continue;

      const src = video.getAttribute('src') || video.getAttribute('poster');
      if (!src) continue;

      // 클릭된 요소 확인
      if (
        video === clickedElement ||
        clickedElement.contains(video) ||
        video.contains(clickedElement)
      ) {
        clickedIndex = items.length;
      }

      const mediaInfo: MediaInfo = {
        id: `video_${i}`,
        url: src,
        type: 'video',
        filename: '',
        tweetUsername: tweetInfo?.username || parseUsernameFast() || undefined,
        tweetId: tweetInfo?.tweetId || undefined,
        tweetUrl: tweetInfo?.tweetUrl || '',
        originalUrl: src,
        thumbnailUrl: video.getAttribute('poster') || src,
        alt: `Video ${i + 1}`,
        metadata: {
          source: 'video-element',
        },
      };

      items.push(mediaInfo);
    }

    return { items, clickedIndex };
  }

  /**
   * 데이터 속성에서 미디어 추출
   */
  private extractFromDataAttributes(
    tweetContainer: HTMLElement,
    _clickedElement: HTMLElement,
    tweetInfo?: TweetInfo
  ): { items: MediaInfo[]; clickedIndex: number } {
    const elementsWithData = tweetContainer.querySelectorAll(
      '[data-src], [data-background-image], [data-url]'
    );
    const items: MediaInfo[] = [];

    for (let i = 0; i < elementsWithData.length; i++) {
      const element = elementsWithData[i];
      if (!element) continue;

      const dataSrc = element.getAttribute('data-src');
      const dataBg = element.getAttribute('data-background-image');
      const dataUrl = element.getAttribute('data-url');
      const url = dataSrc || dataBg || dataUrl;

      if (!url || !this.isValidMediaUrl(url)) continue;

      const mediaInfo: MediaInfo = {
        id: `data_${i}`,
        url,
        type: this.detectMediaType(url),
        filename: '',
        tweetUsername: tweetInfo?.username || parseUsernameFast() || undefined,
        tweetId: tweetInfo?.tweetId || undefined,
        tweetUrl: tweetInfo?.tweetUrl || '',
        originalUrl: url,
        thumbnailUrl: url,
        alt: `Media ${i + 1}`,
        metadata: {
          source: 'data-attribute',
        },
      };

      items.push(mediaInfo);
    }

    return { items, clickedIndex: 0 };
  }

  /**
   * 배경 이미지에서 미디어 추출
   */
  private extractFromBackgroundImages(
    tweetContainer: HTMLElement,
    clickedElement: HTMLElement,
    tweetInfo?: TweetInfo
  ): { items: MediaInfo[]; clickedIndex: number } {
    const elements = tweetContainer.querySelectorAll('*');
    const items: MediaInfo[] = [];
    let clickedIndex = -1;

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i] as HTMLElement;
      if (!element) continue;

      const style = window.getComputedStyle(element);
      const backgroundImage = style.backgroundImage;

      if (!backgroundImage || backgroundImage === 'none') continue;

      const url = this.extractUrlFromBackgroundImage(backgroundImage);
      if (!url || !this.isValidImageUrl(url)) continue;

      // 클릭된 요소 확인
      if (element === clickedElement || element.contains(clickedElement)) {
        clickedIndex = items.length;
      }

      const mediaInfo: MediaInfo = {
        id: `bg_${i}`,
        url,
        type: 'image',
        filename: '',
        tweetUsername: tweetInfo?.username || parseUsernameFast() || undefined,
        tweetId: tweetInfo?.tweetId || undefined,
        tweetUrl: tweetInfo?.tweetUrl || '',
        originalUrl: url,
        thumbnailUrl: url,
        alt: `Background Image ${i + 1}`,
        metadata: {
          source: 'background-image',
        },
      };

      items.push(mediaInfo);
    }

    return { items, clickedIndex };
  }

  /**
   * 유효한 이미지 URL 확인
   */
  private isValidImageUrl(url: string): boolean {
    return url.startsWith('http') && !url.includes('profile_images');
  }

  /**
   * 유효한 미디어 URL 확인
   */
  private isValidMediaUrl(url: string): boolean {
    return (
      url.startsWith('http') &&
      (url.includes('.jpg') ||
        url.includes('.png') ||
        url.includes('.gif') ||
        url.includes('.mp4') ||
        url.includes('.webm') ||
        url.includes('pbs.twimg.com'))
    );
  }

  /**
   * 미디어 타입 감지
   */
  private detectMediaType(url: string): 'image' | 'video' {
    if (url.includes('.mp4') || url.includes('.webm') || url.includes('video')) {
      return 'video';
    }
    return 'image';
  }

  /**
   * 배경 이미지에서 URL 추출
   */
  private extractUrlFromBackgroundImage(backgroundImage: string): string | null {
    const match = backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
    return match?.[1] || null;
  }
}
