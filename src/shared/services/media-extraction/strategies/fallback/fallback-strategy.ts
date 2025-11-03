/**
 * @fileoverview 미디어 추출 백업 전략
 * @description 모든 fallback 방법을 하나의 클래스로 통합
 * @version 1.0.0 - 단순화 작업
 */

import { logger } from '@shared/logging';
import { parseUsernameFast } from '@shared/services/media/username-extraction-service';
import {
  extractOriginalImageUrl,
  canExtractOriginalImage,
} from '@shared/utils/media/media-url.util';
import type { MediaInfo, MediaExtractionResult, MediaType } from '@shared/types/media.types';
import type { TweetInfo, FallbackExtractionStrategy } from '@shared/types/media.types';

/**
 * 백업 추출 전략
 * 이미지, 비디오, 데이터 속성, 배경 이미지 추출을 모두 처리
 */
export class FallbackStrategy implements FallbackExtractionStrategy {
  readonly name = 'fallback';

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

      const { items: dedupedItems, removedCount } = this.dedupeMediaItems(mediaItems);
      const resolvedClickedIndex = this.resolveClickedIndex(clickedIndex, mediaItems, dedupedItems);

      if (removedCount > 0) {
        logger.debug('[FallbackStrategy] Duplicate media entries removed', {
          before: mediaItems.length,
          after: dedupedItems.length,
          removed: removedCount,
          tweetId: tweetInfo?.tweetId ?? null,
        });
      }

      return this.createSuccessResult(dedupedItems, resolvedClickedIndex, tweetInfo);
    } catch (error) {
      logger.error('[FallbackStrategy] 추출 오류:', error);
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
      if (!this.isValidMediaUrl(src)) continue;

      // 클릭된 요소 확인
      if (img === clickedElement || clickedElement.contains(img) || img.contains(clickedElement)) {
        clickedIndex = items.length;
      }

      // 원본(orig) 고화질 URL로 변환
      const originalUrl = extractOriginalImageUrl(src);

      // Twitter 미디어인 경우만 상세 로깅
      if (canExtractOriginalImage(src)) {
        logger.debug('[FallbackStrategy] 원본 이미지 추출 성공', {
          sourceUrl: src,
          extractedUrl: originalUrl,
          index: i,
          tweetId: tweetInfo?.tweetId,
        });
      } else if (src?.includes('pbs.twimg.com')) {
        logger.debug('[FallbackStrategy] 원본 이미지 추출 불가능 (이미 orig)', {
          sourceUrl: src,
        });
      }

      const mediaInfo = this.createMediaInfo(`img_${i}`, originalUrl, 'image', tweetInfo, {
        alt: img.getAttribute('alt') || `Image ${i + 1}`,
        fallbackSource: 'img-element',
        originalUrl: src,
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

      const mediaInfo = this.createMediaInfo(`video_${i}`, src, 'video', tweetInfo, {
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

      if (!this.isValidMediaUrl(url)) continue;

      // 클릭된 요소 확인
      if (element === clickedElement || element.contains(clickedElement)) {
        clickedIndex = items.length;
      }

      // 이미지는 고품질 원본 URL 추출
      const mediaType = this.detectMediaType(url);
      const processedUrl = mediaType === 'image' ? extractOriginalImageUrl(url) : url;

      const mediaInfo = this.createMediaInfo(`data_${i}`, processedUrl, mediaType, tweetInfo, {
        alt: `Data Media ${i + 1}`,
        fallbackSource: 'data-attribute',
        originalUrl: mediaType === 'image' ? url : null,
      });

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
      if (!this.isValidMediaUrl(url)) continue;

      // 클릭된 요소 확인
      if (element === clickedElement || element.contains(clickedElement)) {
        clickedIndex = items.length;
      }

      // 배경 이미지도 고품질 원본 URL 추출
      const originalUrl = extractOriginalImageUrl(url);
      const mediaInfo = this.createMediaInfo(`bg_${i}`, originalUrl, 'image', tweetInfo, {
        alt: `Background Image ${i + 1}`,
        fallbackSource: 'background-image',
        originalUrl: url,
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
    type: MediaType,
    tweetInfo?: TweetInfo,
    options: {
      thumbnailUrl?: string;
      alt?: string;
      fallbackSource?: string;
      originalUrl?: string | null;
    } = {}
  ): MediaInfo {
    return {
      id,
      url,
      type,
      filename: '',
      tweetUsername: tweetInfo?.username || parseUsernameFast() || '',
      tweetId: tweetInfo?.tweetId || '',
      tweetUrl: tweetInfo?.tweetUrl || '',
      originalUrl: options.originalUrl || url,
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
  private isValidMediaUrl(url: string | null | undefined): url is string {
    if (!url) {
      return false;
    }

    const trimmed = url.trim();
    if (!trimmed) {
      return false;
    }

    if (trimmed.includes('profile_images')) {
      return false;
    }

    try {
      const parsed = new URL(trimmed);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return /^https?:\/\//i.test(trimmed);
    }
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

  private dedupeMediaItems(mediaItems: MediaInfo[]): { items: MediaInfo[]; removedCount: number } {
    if (mediaItems.length === 0) {
      return { items: [], removedCount: 0 };
    }

    const seenKeys = new Set<string>();
    const deduped: MediaInfo[] = [];
    let removedCount = 0;

    for (const item of mediaItems) {
      const key = this.buildDedupeKey(item);
      if (key) {
        if (seenKeys.has(key)) {
          removedCount += 1;
          continue;
        }
        seenKeys.add(key);
      }

      deduped.push(item);
    }

    return { items: deduped, removedCount };
  }

  private resolveClickedIndex(
    originalIndex: number,
    originalItems: MediaInfo[],
    dedupedItems: MediaInfo[]
  ): number {
    if (dedupedItems.length === 0) {
      return 0;
    }

    const boundedOriginalIndex = Math.max(0, Math.min(originalIndex, originalItems.length - 1));
    const originalItem = originalItems[boundedOriginalIndex];
    if (!originalItem) {
      return 0;
    }

    const targetKey = this.buildDedupeKey(originalItem);
    if (targetKey) {
      const byKeyIndex = dedupedItems.findIndex(item => this.buildDedupeKey(item) === targetKey);
      if (byKeyIndex >= 0) {
        return byKeyIndex;
      }
    }

    const normalizedUrl = this.normalizeUrlForDedupe(originalItem.originalUrl ?? originalItem.url);
    if (normalizedUrl) {
      const byUrlIndex = dedupedItems.findIndex(candidate => {
        const candidateUrl = this.normalizeUrlForDedupe(candidate.originalUrl ?? candidate.url);
        return candidateUrl !== null && candidateUrl === normalizedUrl;
      });
      if (byUrlIndex >= 0) {
        return byUrlIndex;
      }
    }

    const byIdIndex = dedupedItems.findIndex(item => item.id === originalItem.id);
    if (byIdIndex >= 0) {
      return byIdIndex;
    }

    return Math.min(boundedOriginalIndex, dedupedItems.length - 1);
  }

  private buildDedupeKey(item: MediaInfo): string | null {
    const metadata = item.metadata as Record<string, unknown> | undefined;
    const mediaKey = this.extractMediaKey(metadata);
    if (mediaKey) {
      return `media-key:${mediaKey}`;
    }

    const normalizedUrl = this.normalizeUrlForDedupe(item.originalUrl ?? item.url);
    if (normalizedUrl) {
      return `url:${normalizedUrl}`;
    }

    return null;
  }

  private extractMediaKey(metadata?: Record<string, unknown>): string | null {
    if (!metadata) {
      return null;
    }

    const direct = this.normalizeMediaKeyValue(metadata['media_key']);
    if (direct) {
      return direct;
    }

    const camel = this.normalizeMediaKeyValue(metadata['mediaKey']);
    if (camel) {
      return camel;
    }

    const apiData = metadata['apiData'];
    if (apiData && typeof apiData === 'object') {
      const apiKey = this.normalizeMediaKeyValue((apiData as Record<string, unknown>)['media_key']);
      if (apiKey) {
        return apiKey;
      }

      const apiKeyCamel = this.normalizeMediaKeyValue(
        (apiData as Record<string, unknown>)['mediaKey']
      );
      if (apiKeyCamel) {
        return apiKeyCamel;
      }
    }

    return null;
  }

  private normalizeMediaKeyValue(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed.toLowerCase() : null;
  }

  private normalizeUrlForDedupe(url?: string | null): string | null {
    if (!url) {
      return null;
    }

    try {
      const parsed = new URL(url);
      const normalized = `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
      return normalized.toLowerCase();
    } catch {
      const withoutQuery = url.split('?')[0] ?? url;
      const withoutHash = withoutQuery.split('#')[0] ?? withoutQuery;
      const sanitized = withoutHash.trim();
      if (!sanitized) {
        return null;
      }
      return sanitized.toLowerCase();
    }
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
