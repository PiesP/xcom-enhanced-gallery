/**
 * @fileoverview 미디어 추출 복합 폴백 전략
 */

import { BaseFallbackStrategy } from './BaseFallbackStrategy';
import type { MediaInfo } from '../../../../../core/types/media.types';
import type { TweetInfo, MediaExtractionResult } from '../../interfaces/extraction.interfaces';

/**
 * 모든 fallback 방법을 조합한 전략
 * DOM 요소, 데이터 속성, 배경 이미지 등을 순차적으로 검사
 */
export class CompositeFallbackStrategy extends BaseFallbackStrategy {
  readonly name = 'composite-fallback';

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

      return this.createSuccessResult(mediaItems, tweetInfo);
    } catch (error) {
      return this.createFailureResult(
        error instanceof Error ? error.message : String(error),
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
      if (img === clickedElement || img.contains(clickedElement)) {
        clickedIndex = items.length;
      }

      const mediaInfo = this.createMediaInfo(`fallback_img_${i}`, src, 'image', tweetInfo, {
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
      if (video === clickedElement || video.contains(clickedElement)) {
        clickedIndex = items.length;
      }

      const mediaInfo = this.createMediaInfo(`fallback_video_${i}`, src, 'video', tweetInfo, {
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
        `fallback_data_${i}`,
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

      const url = this.extractUrlFromStyle(backgroundImage);
      if (!url || !this.isValidMediaUrl(url)) continue;

      // 클릭된 요소 확인
      if (element === clickedElement || element.contains(clickedElement)) {
        clickedIndex = items.length;
      }

      const mediaInfo = this.createMediaInfo(`fallback_bg_${i}`, url, 'image', tweetInfo, {
        alt: `Background Image ${i + 1}`,
        fallbackSource: 'background-image',
      });

      items.push(mediaInfo);
    }

    return { items, clickedIndex };
  }

  /**
   * 배경 이미지 스타일에서 URL 추출
   */
  private extractUrlFromStyle(backgroundImage: string): string | null {
    const match = backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
    return match ? (match[1] ?? null) : null;
  }
}
