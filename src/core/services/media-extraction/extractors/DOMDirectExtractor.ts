/**
 * @fileoverview DOM 추출기 (백업 전략용)
 * @description 기본적인 DOM 파싱을 수행하는 백업 추출기
 * @version 3.0.0 - Clean Architecture
 */

import { logger } from '@core/logging/logger';
import type { MediaExtractionOptions, TweetInfo } from '@core/types/extraction.types';
import type { MediaExtractionResult, MediaInfo } from '@core/types/media.types';

/**
 * DOM 추출기 (백업 전략용)
 * 기본적인 DOM 파싱 수행
 */
export class DOMDirectExtractor {
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
    const selectors = ['[data-testid*="tweet"]', '[role="article"]', '.tweet', 'article'];

    for (const selector of selectors) {
      const container = element.closest(selector);
      if (container) return container as HTMLElement;
    }

    // 컨테이너를 찾지 못하면 요소 자체 반환
    return element;
  }

  /**
   * 컨테이너에서 미디어 추출
   */
  private extractMediaFromContainer(container: HTMLElement, tweetInfo?: TweetInfo): MediaInfo[] {
    const mediaItems: MediaInfo[] = [];

    // 이미지 추출
    const images = container.querySelectorAll('img[src*="pbs.twimg.com"]');
    images.forEach((img, index) => {
      const imgElement = img as HTMLImageElement;
      if (this.isValidImageUrl(imgElement.src)) {
        const originalUrl = this.getOriginalImageUrl(imgElement.src);
        if (originalUrl) {
          mediaItems.push(this.createImageMediaInfo(originalUrl, index, tweetInfo));
        }
      }
    });

    // 비디오 추출
    const videos = container.querySelectorAll('video[src*="video.twimg.com"]');
    videos.forEach((video, _index) => {
      const videoElement = video as HTMLVideoElement;
      if (videoElement.src) {
        mediaItems.push(this.createVideoMediaInfo(videoElement.src, mediaItems.length, tweetInfo));
      }
    });

    return mediaItems;
  }

  /**
   * 이미지 MediaInfo 생성
   */
  private createImageMediaInfo(url: string, index: number, tweetInfo?: TweetInfo): MediaInfo {
    return {
      id: `img_${Date.now()}_${index}`,
      url,
      type: 'image',
      originalUrl: url,
      filename: this.generateFilename('image', index, tweetInfo),
      tweetId: tweetInfo?.tweetId,
      tweetUsername: tweetInfo?.username,
    };
  }

  /**
   * 비디오 MediaInfo 생성
   */
  private createVideoMediaInfo(url: string, index: number, tweetInfo?: TweetInfo): MediaInfo {
    return {
      id: `vid_${Date.now()}_${index}`,
      url,
      type: 'video',
      originalUrl: url,
      filename: this.generateFilename('video', index, tweetInfo),
      thumbnailUrl: this.generateVideoThumbnail(url),
      tweetId: tweetInfo?.tweetId,
      tweetUsername: tweetInfo?.username,
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
   * 원본 이미지 URL 생성
   */
  private getOriginalImageUrl(url: string): string {
    // format=jpg&name=orig로 변경하여 원본 이미지 URL 생성
    return url.replace(/format=\w+&name=\w+/, 'format=jpg&name=orig');
  }

  /**
   * 유효한 이미지 URL 검사
   */
  private isValidImageUrl(url: string): boolean {
    return (
      url.startsWith('http') && url.includes('pbs.twimg.com') && !url.includes('profile_images')
    );
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
