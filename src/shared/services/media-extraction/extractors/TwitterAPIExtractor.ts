/**
 * @fileoverview Twitter API 기반 미디어 추출기
 * @description 트윗 정보가 확보된 후 API를 통한 정확한 미디어 추출
 * @version 2.0.0 - Clean Architecture
 */

import { logger } from '@shared/logging/logger';
import { TwitterAPI, type TweetMediaEntry } from '@shared/services/media/TwitterVideoExtractor';
import type { MediaInfo, MediaExtractionResult } from '@shared/types/media.types';
import type { TweetInfo, MediaExtractionOptions, APIExtractor } from '@shared/types/media.types';

/**
 * Twitter API 기반 추출기
 * 트윗 정보가 확보된 후 API를 통한 정확한 미디어 추출
 */
export class TwitterAPIExtractor implements APIExtractor {
  /**
   * API 기반 미디어 추출
   */
  async extract(
    tweetInfo: TweetInfo,
    clickedElement: HTMLElement,
    options: MediaExtractionOptions,
    extractionId: string
  ): Promise<MediaExtractionResult> {
    try {
      logger.debug(`[APIExtractor] ${extractionId}: API 추출 시작`, {
        tweetId: tweetInfo.tweetId,
        timeout: options.timeoutMs,
      });

      const apiMedias = await TwitterAPI.getTweetMedias(tweetInfo.tweetId);

      if (!apiMedias || apiMedias.length === 0) {
        return this.createFailureResult('No media found in API response');
      }

      const mediaItems = await this.convertAPIMediaToMediaInfo(apiMedias, tweetInfo);
      const clickedIndex = await this.calculateClickedIndex(clickedElement, apiMedias, mediaItems);

      return {
        success: true,
        mediaItems,
        clickedIndex,
        metadata: {
          extractedAt: Date.now(),
          sourceType: 'twitter-api',
          strategy: 'api-extraction',
          totalProcessingTime: 0,
          apiMediaCount: apiMedias.length,
        },
        tweetInfo,
      };
    } catch (error) {
      logger.warn(`[APIExtractor] ${extractionId}: API 추출 실패:`, error);
      return this.createFailureResult(
        error instanceof Error ? error.message : 'API extraction failed'
      );
    }
  }

  /**
   * API 미디어를 MediaInfo로 변환
   */
  private async convertAPIMediaToMediaInfo(
    apiMedias: TweetMediaEntry[],
    tweetInfo: TweetInfo
  ): Promise<MediaInfo[]> {
    const mediaItems: MediaInfo[] = [];

    for (let i = 0; i < apiMedias.length; i++) {
      const apiMedia = apiMedias[i];
      if (!apiMedia) continue;

      const mediaInfo = this.createMediaInfoFromAPI(apiMedia, tweetInfo, i);
      if (mediaInfo) {
        mediaItems.push(mediaInfo);
      }
    }

    return mediaItems;
  }

  /**
   * API 미디어에서 MediaInfo 생성
   */
  private createMediaInfoFromAPI(
    apiMedia: TweetMediaEntry,
    tweetInfo: TweetInfo,
    index: number
  ): MediaInfo | null {
    try {
      // 타입 변환: photo -> image, video -> video
      const mediaType = apiMedia.type === 'photo' ? 'image' : 'video';

      return {
        id: `${tweetInfo.tweetId}_api_${index}`,
        url: apiMedia.download_url,
        type: mediaType,
        filename: '',
        tweetUsername: tweetInfo.username,
        tweetId: tweetInfo.tweetId,
        tweetUrl: tweetInfo.tweetUrl,
        originalUrl: apiMedia.download_url,
        thumbnailUrl: apiMedia.preview_url,
        alt: `${mediaType} ${index + 1}`,
        metadata: {
          apiIndex: index,
          apiData: apiMedia,
        },
      };
    } catch (error) {
      logger.error('API MediaInfo 생성 실패:', error);
      return null;
    }
  }

  /**
   * 클릭된 미디어 인덱스 계산
   */
  private async calculateClickedIndex(
    clickedElement: HTMLElement,
    apiMedias: TweetMediaEntry[],
    mediaItems: MediaInfo[]
  ): Promise<number> {
    // 1. 클릭된 이미지/비디오 요소 찾기
    const mediaElement = this.findMediaElement(clickedElement);
    if (!mediaElement) {
      logger.debug('[APIExtractor] 클릭된 미디어 요소를 찾을 수 없음');
      return 0;
    }

    // 2. 이미지/비디오 URL 매칭
    const clickedUrl = this.extractMediaUrl(mediaElement);
    if (clickedUrl) {
      const matchedIndex = this.findMatchingMediaIndex(clickedUrl, apiMedias);
      if (matchedIndex !== -1) {
        logger.debug(`[APIExtractor] URL 매칭 성공: 인덱스 ${matchedIndex}`);
        return matchedIndex;
      }
    }

    // 3. DOM 순서 기반 추정
    const estimatedIndex = this.estimateIndexFromDOMOrder(clickedElement, mediaItems.length);
    logger.debug(`[APIExtractor] DOM 순서 기반 추정: 인덱스 ${estimatedIndex}`);
    return estimatedIndex;
  }

  /**
   * 클릭된 요소에서 미디어 요소 찾기
   */
  private findMediaElement(element: HTMLElement): HTMLElement | null {
    // 클릭된 요소가 이미 미디어 요소인지 확인
    if (element.tagName === 'IMG' || element.tagName === 'VIDEO') {
      return element;
    }

    // 자식 요소에서 미디어 찾기
    const mediaChild = element.querySelector('img, video');
    if (mediaChild) {
      return mediaChild as HTMLElement;
    }

    // 부모 요소에서 미디어 찾기
    let current = element.parentElement;
    for (let i = 0; i < 5 && current; i++) {
      const parentMedia = current.querySelector('img, video');
      if (parentMedia) {
        return parentMedia as HTMLElement;
      }
      current = current.parentElement;
    }

    return null;
  }

  /**
   * 미디어 요소에서 URL 추출
   */
  private extractMediaUrl(element: HTMLElement): string | null {
    if (element.tagName === 'IMG') {
      return element.getAttribute('src');
    }
    if (element.tagName === 'VIDEO') {
      return element.getAttribute('poster') || element.getAttribute('src');
    }
    return null;
  }

  /**
   * URL을 기반으로 매칭되는 미디어 인덱스 찾기
   */
  private findMatchingMediaIndex(clickedUrl: string, apiMedias: TweetMediaEntry[]): number {
    // 정확한 URL 매칭
    for (let i = 0; i < apiMedias.length; i++) {
      const apiMedia = apiMedias[i];
      if (!apiMedia) continue;

      if (apiMedia.download_url === clickedUrl || apiMedia.preview_url === clickedUrl) {
        return i;
      }
    }

    // 파일명 기반 매칭
    const clickedFilename = this.extractFilenameFromUrl(clickedUrl);
    if (clickedFilename) {
      for (let i = 0; i < apiMedias.length; i++) {
        const apiMedia = apiMedias[i];
        if (!apiMedia) continue;

        const apiFilename = this.extractFilenameFromUrl(apiMedia.download_url);
        if (apiFilename && clickedFilename === apiFilename) {
          return i;
        }
      }
    }

    return -1;
  }

  /**
   * URL에서 파일명 추출
   */
  private extractFilenameFromUrl(url: string): string | null {
    try {
      // URL 생성자를 안전하게 시도
      let URLConstructor: typeof URL | undefined;
      
      if (typeof globalThis !== 'undefined' && typeof globalThis.URL === 'function') {
        URLConstructor = globalThis.URL;
      } else if (typeof window !== 'undefined' && typeof window.URL === 'function') {
        URLConstructor = window.URL;
      }
      
      if (!URLConstructor) {
        // Fallback: 간단한 파싱
        const lastSlashIndex = url.lastIndexOf('/');
        if (lastSlashIndex === -1) return null;
        const filename = url.substring(lastSlashIndex + 1);
        return filename.length > 0 ? filename : null;
      }

      const urlObj = new URLConstructor(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop();
      return filename || null;
    } catch {
      return null;
    }
  }

  /**
   * DOM 순서 기반 인덱스 추정
   */
  private estimateIndexFromDOMOrder(element: HTMLElement, mediaCount: number): number {
    // 트윗 컨테이너 찾기
    const tweetContainer = element.closest('[data-testid="tweet"], article');
    if (!tweetContainer) return 0;

    // 컨테이너 내 모든 미디어 요소 찾기
    const allMediaElements = tweetContainer.querySelectorAll('img, video');
    const mediaArray = Array.from(allMediaElements);

    // 클릭된 요소의 인덱스 찾기
    const clickedMedia = this.findMediaElement(element);
    if (clickedMedia) {
      const index = mediaArray.indexOf(clickedMedia);
      if (index !== -1 && index < mediaCount) {
        return index;
      }
    }

    return 0;
  }

  /**
   * 실패 결과 생성
   */
  private createFailureResult(error: string): MediaExtractionResult {
    return {
      success: false,
      mediaItems: [],
      clickedIndex: 0,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'twitter-api',
        strategy: 'api-extraction-failed',
        error,
      },
      tweetInfo: null,
    };
  }
}
