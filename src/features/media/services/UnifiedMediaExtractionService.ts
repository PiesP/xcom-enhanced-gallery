/**
 * @fileoverview 통합된 미디어 추출 서비스
 * @description 모든 미디어 추출 기능을 하나로 통합한 서비스
 * @version 2.0.0 - Unified Architecture
 */

import type {
  MediaExtractionResult,
  MediaExtractor,
} from '../../../core/interfaces/gallery.interfaces';
import type { MediaInfo } from '../../../core/types/media.types';
import { logger } from '../../../infrastructure/logging/logger';
import { UnifiedTweetIdExtractor } from '../../../shared/utils/patterns/tweet-extraction/UnifiedTweetIdExtractor';
import type { TweetExtractionResult } from '../../../shared/utils/patterns/tweet-extraction/UnifiedTweetIdExtractor';

export interface UnifiedExtractionOptions {
  timeout?: number;
  includeVideos?: boolean;
  enableBackgroundLoading?: boolean;
  maxRetries?: number;
}

/**
 * 통합된 미디어 추출 서비스
 * 기존의 MediaExtractionService, StableMediaExtractionService 등을 통합
 */
export class UnifiedMediaExtractionService implements MediaExtractor {
  private static instance: UnifiedMediaExtractionService;

  private constructor() {
    logger.debug('[UnifiedMediaExtractionService] 초기화됨');
  }

  public static getInstance(): UnifiedMediaExtractionService {
    UnifiedMediaExtractionService.instance ??= new UnifiedMediaExtractionService();
    return UnifiedMediaExtractionService.instance;
  }

  /**
   * 클릭된 요소에서 미디어를 추출합니다.
   */
  public async extractFromClickedElement(
    clickedElement: HTMLElement,
    _options: UnifiedExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    logger.debug('[UnifiedMediaExtractionService] 클릭 요소에서 미디어 추출 시작');

    try {
      // 1. 트윗 정보 추출
      const tweetInfo = UnifiedTweetIdExtractor.extractTweetId(clickedElement);
      if (!tweetInfo) {
        return this.createErrorResult('트윗 정보를 추출할 수 없습니다');
      }

      // 2. 트윗 컨테이너 찾기
      const tweetContainer = this.findTweetContainer(clickedElement);
      if (!tweetContainer) {
        return this.createErrorResult('트윗 컨테이너를 찾을 수 없습니다');
      }

      // 3. 미디어 추출
      const mediaItems = this.extractMediaFromContainer(tweetContainer, tweetInfo);
      if (mediaItems.length === 0) {
        return this.createErrorResult('미디어를 찾을 수 없습니다');
      }

      // 4. 클릭된 미디어의 인덱스 찾기
      const clickedIndex = this.findClickedMediaIndex(clickedElement, mediaItems);

      return {
        success: true,
        mediaItems,
        clickedIndex,
        metadata: {
          extractedAt: Date.now(),
          sourceType: 'media',
          strategy: 'click-based',
        },
        tweetInfo: this.convertToLegacyTweetInfo(tweetInfo),
      };
    } catch (error) {
      logger.error('[UnifiedMediaExtractionService] 추출 실패:', error);
      return this.createErrorResult(`추출 중 오류: ${error}`);
    }
  }

  /**
   * 컨테이너에서 모든 미디어를 추출합니다.
   */
  public async extractAllFromContainer(
    container: HTMLElement,
    _options: UnifiedExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    logger.debug('[UnifiedMediaExtractionService] 컨테이너에서 전체 미디어 추출');

    try {
      // 트윗 정보 추출
      const tweetInfo = UnifiedTweetIdExtractor.extractTweetId(container);
      if (!tweetInfo) {
        return this.createErrorResult('트윗 정보를 추출할 수 없습니다');
      }

      // 미디어 추출
      const mediaItems = this.extractMediaFromContainer(container, tweetInfo);
      if (mediaItems.length === 0) {
        return this.createErrorResult('미디어를 찾을 수 없습니다');
      }

      return {
        success: true,
        mediaItems,
        clickedIndex: 0,
        metadata: {
          extractedAt: Date.now(),
          sourceType: 'media',
          strategy: 'container-based',
        },
        tweetInfo: this.convertToLegacyTweetInfo(tweetInfo),
      };
    } catch (error) {
      logger.error('[UnifiedMediaExtractionService] 컨테이너 추출 실패:', error);
      return this.createErrorResult(`추출 중 오류: ${error}`);
    }
  }

  /**
   * 트윗 컨테이너를 찾습니다.
   */
  private findTweetContainer(element: HTMLElement): HTMLElement | null {
    const selectors = [
      'article[data-testid="tweet"]',
      'article[role="article"]',
      '[data-testid="tweet"]',
    ];

    for (const selector of selectors) {
      const container = element.closest(selector) as HTMLElement;
      if (container) return container;
    }

    return null;
  }

  /**
   * 컨테이너에서 미디어 아이템들을 추출합니다.
   */
  private extractMediaFromContainer(
    container: HTMLElement,
    tweetInfo: TweetExtractionResult
  ): MediaInfo[] {
    const mediaItems: MediaInfo[] = [];

    // 이미지 추출
    const images = container.querySelectorAll('img[src*="pbs.twimg.com"]');
    images.forEach((img, index) => {
      const imgElement = img as HTMLImageElement;
      if (this.isValidMediaImage(imgElement.src)) {
        mediaItems.push(this.createImageMediaInfo(imgElement, tweetInfo, index));
      }
    });

    // 비디오 추출
    const videos = container.querySelectorAll('video[src*="video.twimg.com"]');
    videos.forEach((video, _index) => {
      const videoElement = video as HTMLVideoElement;
      if (videoElement.src) {
        mediaItems.push(this.createVideoMediaInfo(videoElement, tweetInfo, mediaItems.length));
      }
    });

    return mediaItems;
  }

  /**
   * 클릭된 미디어의 인덱스를 찾습니다.
   */
  private findClickedMediaIndex(clickedElement: HTMLElement, mediaItems: MediaInfo[]): number {
    // 클릭된 요소가 이미지인 경우
    if (clickedElement.tagName === 'IMG') {
      const imgSrc = (clickedElement as HTMLImageElement).src;
      const index = mediaItems.findIndex(item => item.url.includes(imgSrc.split('?')[0]!));
      return Math.max(0, index);
    }

    // 클릭된 요소가 비디오인 경우
    if (clickedElement.tagName === 'VIDEO') {
      const videoSrc = (clickedElement as HTMLVideoElement).src;
      const index = mediaItems.findIndex(item => item.url.includes(videoSrc.split('?')[0]!));
      return Math.max(0, index);
    }

    return 0;
  }

  /**
   * 이미지 MediaInfo 생성
   */
  private createImageMediaInfo(
    img: HTMLImageElement,
    tweetInfo: TweetExtractionResult,
    index: number
  ): MediaInfo {
    const originalUrl = this.getOriginalImageUrl(img.src);

    return {
      id: `${tweetInfo.tweetId}-img-${index}`,
      type: 'image',
      url: originalUrl,
      thumbnailUrl: img.src,
      originalUrl,
      tweetId: tweetInfo.tweetId,
      tweetUsername: tweetInfo.username,
      tweetUrl: tweetInfo.tweetUrl,
      filename: `${tweetInfo.tweetId}_${index + 1}.jpg`,
      alt: img.alt || `Image ${index + 1}`,
    };
  }

  /**
   * 비디오 MediaInfo 생성
   */
  private createVideoMediaInfo(
    video: HTMLVideoElement,
    tweetInfo: TweetExtractionResult,
    index: number
  ): MediaInfo {
    return {
      id: `${tweetInfo.tweetId}-video-${index}`,
      type: 'video',
      url: video.src,
      thumbnailUrl: video.poster || this.getVideoThumbnail(video.src),
      originalUrl: video.src,
      tweetId: tweetInfo.tweetId,
      tweetUsername: tweetInfo.username,
      tweetUrl: tweetInfo.tweetUrl,
      filename: `${tweetInfo.tweetId}_${index + 1}.mp4`,
      alt: `Video ${index + 1}`,
    };
  }

  /**
   * 원본 이미지 URL 생성
   */
  private getOriginalImageUrl(url: string): string {
    return url.replace(/:(small|medium|large)$/, ':orig');
  }

  /**
   * 비디오 썸네일 URL 생성
   */
  private getVideoThumbnail(videoUrl: string): string {
    // 간단한 썸네일 생성 로직
    return videoUrl.replace(/\/[^/]+\.mp4/, '/thumbnail.jpg');
  }

  /**
   * 유효한 미디어 이미지인지 확인
   */
  private isValidMediaImage(url: string): boolean {
    return (
      url.includes('pbs.twimg.com') &&
      !url.includes('profile_images') &&
      !url.includes('profile_banners')
    );
  }

  /**
   * TweetExtractionResult를 레거시 TweetInfo로 변환
   */
  private convertToLegacyTweetInfo(result: TweetExtractionResult) {
    return {
      tweetId: result.tweetId,
      username: result.username || '',
      tweetUrl: result.tweetUrl,
      url: result.tweetUrl,
      extractionMethod: result.extractionMethod,
    };
  }

  /**
   * 에러 결과 생성
   */
  private createErrorResult(error: string): MediaExtractionResult {
    return {
      success: false,
      mediaItems: [],
      clickedIndex: 0,
      error,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'media',
      },
      tweetInfo: null,
    };
  }

  /**
   * 서비스 정리
   */
  public async dispose(): Promise<void> {
    logger.debug('[UnifiedMediaExtractionService] 정리 완료');
  }
}
