/**
 * @fileoverview 통합 미디어 추출 백업 전략
 * @description 모든 fallback 방법을 하나의 클래스로 통합
 * @version 1.0.0 - 단순화 작업
 */

import { logger } from '@core/logging/logger';
import { parseUsernameFast } from '../../../../../core/services/media/UsernameExtractionService';
import type { MediaInfo } from '../../../../../core/types/media.types';
import type {
  TweetInfo,
  MediaExtractionResult,
  FallbackExtractionStrategy,
} from '../../interfaces/extraction.interfaces';

/**
 * 통합 백업 추출 전략
 * 이미지, 비디오, 데이터 속성, 배경 이미지 추출을 모두 처리
 */
export class UnifiedFallbackStrategy implements FallbackExtractionStrategy {
  readonly name = 'unified-fallback';

  async extract(
    tweetContainer: HTMLElement,
    clickedElement: HTMLElement,
    tweetInfo?: TweetInfo
  ): Promise<MediaExtractionResult> {
    try {
      const mediaItems: MediaInfo[] = [];
      let clickedIndex = 0;

      // 1. 이미지 요소에서 추출
      const imageResult = this.extractFromImages(tweetContainer, clickedElement, tweetInfo);
      if (imageResult.clickedIndex >= 0) {
        clickedIndex = mediaItems.length + imageResult.clickedIndex;
      }
      mediaItems.push(...imageResult.items);

      // 2. 비디오 요소에서 추출
      const videoResult = this.extractFromVideos(tweetContainer, clickedElement, tweetInfo);
      if (videoResult.clickedIndex >= 0 && clickedIndex === 0) {
        clickedIndex = mediaItems.length + videoResult.clickedIndex;
      }
      mediaItems.push(...videoResult.items);

      // 3. 데이터 속성에서 추출
      const dataResult = this.extractFromDataAttributes(tweetContainer, clickedElement, tweetInfo);
      if (dataResult.clickedIndex >= 0 && clickedIndex === 0) {
        clickedIndex = mediaItems.length + dataResult.clickedIndex;
      }
      mediaItems.push(...dataResult.items);

      // 4. 배경 이미지에서 추출
      const backgroundResult = this.extractFromBackgroundImages(
        tweetContainer,
        clickedElement,
        tweetInfo
      );
      if (backgroundResult.clickedIndex >= 0 && clickedIndex === 0) {
        clickedIndex = mediaItems.length + backgroundResult.clickedIndex;
      }
      mediaItems.push(...backgroundResult.items);

      return this.createSuccessResult(mediaItems, clickedIndex, tweetInfo);
    } catch (error) {
      logger.error('[UnifiedFallbackStrategy] 추출 오류:', error);
      return this.createFailureResult(
        error instanceof Error ? error.message : 'Unknown error',
        tweetInfo
      );
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
      if (!src || !this.isValidMediaUrl(src)) continue;

      // 클릭된 요소 확인
      if (img === clickedElement || clickedElement.contains(img) || img.contains(clickedElement)) {
        clickedIndex = items.length;
      }

      const mediaInfo = this.createMediaInfo(`unified_img_${i}`, src, 'image', tweetInfo, {
        alt: img.getAttribute('alt') || `Image ${i + 1}`,
        fallbackSource: 'img-element',
      });

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

      const mediaInfo = this.createMediaInfo(`unified_video_${i}`, src, 'video', tweetInfo, {
        thumbnailUrl: video.getAttribute('poster') || src,
        alt: `Video ${i + 1}`,
        fallbackSource: 'video-element',
      });

      items.push(mediaInfo);
    }

    return { items, clickedIndex };
  }

  /**
   * 데이터 속성에서 미디어 추출
   */
  private extractFromDataAttributes(
    tweetContainer: HTMLElement,
    clickedElement: HTMLElement,
    tweetInfo?: TweetInfo
  ): { items: MediaInfo[]; clickedIndex: number } {
    const elementsWithData = tweetContainer.querySelectorAll(
      '[data-src], [data-background-image], [data-url]'
    );
    const items: MediaInfo[] = [];
    let clickedIndex = -1;

    for (let i = 0; i < elementsWithData.length; i++) {
      const element = elementsWithData[i];
      if (!element) continue;

      const dataSrc = element.getAttribute('data-src');
      const dataBg = element.getAttribute('data-background-image');
      const dataUrl = element.getAttribute('data-url');
      const url = dataSrc || dataBg || dataUrl;

      if (!url || !this.isValidMediaUrl(url)) continue;

      // 클릭된 요소 확인
      if (element === clickedElement || element.contains(clickedElement)) {
        clickedIndex = items.length;
      }

      const mediaInfo = this.createMediaInfo(
        `unified_data_${i}`,
        url,
        this.detectMediaType(url),
        tweetInfo,
        {
          alt: `Data Media ${i + 1}`,
          fallbackSource: 'data-attribute',
        }
      );

      items.push(mediaInfo);
    }

    return { items, clickedIndex };
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
      if (!url || !this.isValidMediaUrl(url)) continue;

      // 클릭된 요소 확인
      if (element === clickedElement || element.contains(clickedElement)) {
        clickedIndex = items.length;
      }

      const mediaInfo = this.createMediaInfo(`unified_bg_${i}`, url, 'image', tweetInfo, {
        alt: `Background Image ${i + 1}`,
        fallbackSource: 'background-image',
      });

      items.push(mediaInfo);
    }

    return { items, clickedIndex };
  }

  /**
   * MediaInfo 객체 생성
   */
  private createMediaInfo(
    id: string,
    url: string,
    type: 'image' | 'video',
    tweetInfo?: TweetInfo,
    options: {
      thumbnailUrl?: string;
      alt?: string;
      fallbackSource?: string;
    } = {}
  ): MediaInfo {
    return {
      id,
      url,
      type,
      filename: '',
      tweetUsername: tweetInfo?.username || parseUsernameFast() || undefined,
      tweetId: tweetInfo?.tweetId || undefined,
      tweetUrl: tweetInfo?.tweetUrl || '',
      originalUrl: url,
      thumbnailUrl: options.thumbnailUrl || url,
      alt: options.alt || `${type} item`,
      metadata: {
        fallbackSource: options.fallbackSource || this.name,
      },
    };
  }

  /**
   * URL 검증
   */
  private isValidMediaUrl(url: string): boolean {
    return url.startsWith('http') && !url.includes('profile_images');
  }

  /**
   * 미디어 타입 감지
   */
  private detectMediaType(url: string): 'image' | 'video' {
    return url.includes('video') || url.includes('.mp4') || url.includes('.webm')
      ? 'video'
      : 'image';
  }

  /**
   * 배경 이미지에서 URL 추출
   */
  private extractUrlFromBackgroundImage(backgroundImage: string): string | null {
    const match = backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
    return match ? (match[1] ?? null) : null;
  }

  /**
   * 성공 결과 생성
   */
  private createSuccessResult(
    mediaItems: MediaInfo[],
    clickedIndex: number,
    tweetInfo?: TweetInfo
  ): MediaExtractionResult {
    return {
      success: mediaItems.length > 0,
      mediaItems,
      clickedIndex,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'fallback',
        strategy: this.name,
      },
      tweetInfo: tweetInfo ?? null,
    };
  }

  /**
   * 실패 결과 생성
   */
  private createFailureResult(error: string, tweetInfo?: TweetInfo): MediaExtractionResult {
    return {
      success: false,
      mediaItems: [],
      clickedIndex: 0,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'fallback',
        strategy: `${this.name}-failed`,
        error,
      },
      tweetInfo: tweetInfo ?? null,
    };
  }
}
