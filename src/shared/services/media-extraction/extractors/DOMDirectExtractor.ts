/**
 * @fileoverview DOM 추출기 (백업 전략용)
 * @description 기본적인 DOM 파싱을 수행하는 백업 추출기
 * @version 3.1.0 - Phase 1-2 (GREEN): 비디오/GIF 추출 강화
 */

import { logger } from '@shared/logging/logger';
import { extractOriginalImageUrl, isValidMediaUrl } from '@shared/utils/media/media-url.util';
import { createSelectorRegistry } from '@shared/dom';
import type { MediaExtractionOptions, TweetInfo } from '@shared/types/media.types';
import type { MediaExtractionResult, MediaInfo } from '@shared/types/media.types';
import {
  detectMediaTypeFromUrl,
  detectGifFromVideoElement,
} from '@shared/utils/media/media-type-detection';
import { convertThumbnailToVideoUrl } from '@shared/utils/media/video-url-converter';

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
   * 미디어 컨테이너 찾기
   * Phase 1-2 (GREEN): 단독 이미지/비디오 요소도 자체를 컨테이너로 허용
   */
  private findMediaContainer(element: HTMLElement): HTMLElement | null {
    // 1. 가장 가까운 상위 트윗 컨테이너 우선 선택
    const closestTweet = this.selectors.findClosest(
      [
        'article[data-testid="tweet"]',
        'article[role="article"]',
        'div[data-testid="tweet"]',
        'article',
      ],
      element
    );
    if (closestTweet) return closestTweet as HTMLElement;

    // 2. fallback: 기존 우선순위로 탐색
    const first = this.selectors.findTweetContainer(element) || this.selectors.findTweetContainer();
    if (first) return first as HTMLElement;

    // 3. 트윗 컨테이너를 찾지 못한 경우, 단독 미디어 요소인지 확인
    if (element.tagName === 'IMG' || element.tagName === 'VIDEO') {
      return element;
    }

    // 4. 모든 탐색 실패 시 자기 자신을 컨테이너로 반환 (단독 요소 케이스)
    return element;
  } /**
   * 컨테이너에서 미디어 추출
   * Phase 1-2 (GREEN): 비디오/GIF 탐색 범위 확대 및 타입 추론 강화
   * Phase 1-3 (REFACTOR): 로깅 강화
   */
  private extractMediaFromContainer(container: HTMLElement, tweetInfo?: TweetInfo): MediaInfo[] {
    const mediaItems: MediaInfo[] = [];

    // 이미지 추출 (기존 로직 유지 + GIF 감지 추가)
    let images: NodeListOf<Element>;

    // 컨테이너가 직접 IMG 요소인 경우
    if (container.tagName === 'IMG') {
      logger.debug('[DOMDirectExtractor] 단독 IMG 요소 처리');
      // 자기 자신만 포함
      const imgArray = [container];
      images = imgArray as unknown as NodeListOf<Element>;
    } else {
      images = container.querySelectorAll('img[src]');
    }

    images.forEach((img, index) => {
      const imgElement = img as HTMLImageElement;
      if (this.isValidImageUrl(imgElement.src)) {
        const originalUrl = extractOriginalImageUrl(imgElement.src);
        if (originalUrl) {
          // URL 패턴 기반 타입 추론
          const detectedType = detectMediaTypeFromUrl(originalUrl);
          if (detectedType === 'gif') {
            logger.debug(`[DOMDirectExtractor] GIF 감지 (URL 패턴): ${originalUrl}`);
            mediaItems.push(this.createGifMediaInfo(originalUrl, index, tweetInfo));
          } else {
            mediaItems.push(this.createImageMediaInfo(originalUrl, index, tweetInfo));
          }
        }
      }
    });

    // 비디오 추출 (확장된 범위)
    const videos = this.findVideoElements(container);
    logger.debug(`[DOMDirectExtractor] 비디오 요소 ${videos.length}개 발견`);

    videos.forEach((videoElement, _index) => {
      // Phase 1-3 (GREEN): 비디오 URL 추출 강화
      // 우선순위: video.src → source.src → poster → 변환
      let videoUrl: string | null = null;

      // 1. video.src 직접 확인
      if (videoElement.src) {
        videoUrl = videoElement.src;
        logger.debug('[DOMDirectExtractor] video.src에서 URL 추출', { videoUrl });
      }

      // 2. source 태그 확인
      if (!videoUrl) {
        const source = videoElement.querySelector('source');
        if (source?.src) {
          videoUrl = source.src;
          logger.debug('[DOMDirectExtractor] source 태그에서 URL 추출', { videoUrl });
        }
      }

      // 3. poster 속성 → 비디오 URL 변환
      if (!videoUrl && videoElement.poster) {
        const converted = convertThumbnailToVideoUrl(videoElement.poster);
        if (converted) {
          videoUrl = converted;
          logger.debug('[DOMDirectExtractor] poster → video URL 변환', {
            poster: videoElement.poster,
            videoUrl: converted,
          });
        }
      }

      // 비디오 URL이 추출된 경우에만 MediaInfo 추가
      if (videoUrl) {
        // GIF vs 비디오 구분
        const isGif =
          detectGifFromVideoElement(videoElement) || detectMediaTypeFromUrl(videoUrl) === 'gif';

        if (isGif) {
          logger.debug(`[DOMDirectExtractor] GIF 감지 (비디오 요소): ${videoUrl}`);
          mediaItems.push(this.createGifMediaInfo(videoUrl, mediaItems.length, tweetInfo));
        } else {
          logger.debug(`[DOMDirectExtractor] 비디오 추가: ${videoUrl}`);
          mediaItems.push(this.createVideoMediaInfo(videoUrl, mediaItems.length, tweetInfo));
        }
      } else {
        logger.warn('[DOMDirectExtractor] 비디오 URL 추출 실패 - src, source, poster 모두 없음', {
          tagName: videoElement.tagName,
          hasSource: !!videoElement.querySelector('source'),
          hasPoster: !!videoElement.poster,
        });
      }
    });

    logger.debug(`[DOMDirectExtractor] 총 ${mediaItems.length}개 미디어 추출 완료`);
    return mediaItems;
  }

  /**
   * Phase 1-2 (GREEN): 비디오 요소 탐색 범위 확대
   *
   * 탐색 전략:
   * 1. 직접 video 태그
   * 2. 자식 video 태그
   * 3. role="button" 내부 video (Twitter 플레이어)
   * 4. data-testid="videoComponent" 내부 video
   * 5. 상위 컨테이너에서 video 탐색
   */
  private findVideoElements(element: HTMLElement): HTMLVideoElement[] {
    const videos: HTMLVideoElement[] = [];
    const seen = new Set<HTMLVideoElement>();

    // 중복 제거 헬퍼
    const addUnique = (video: HTMLVideoElement | null) => {
      if (video && !seen.has(video)) {
        seen.add(video);
        videos.push(video);
      }
    };

    // 1. 직접 video 태그
    if (element.tagName === 'VIDEO') {
      addUnique(element as HTMLVideoElement);
    }

    // 2. 자식 video 태그 (모든 비디오 요소)
    const childVideos = element.querySelectorAll('video');
    childVideos.forEach(v => addUnique(v as HTMLVideoElement));

    // 3. role="button" 내부 video 탐색 (Twitter 비디오 플레이어)
    const videoPlayers = element.querySelectorAll('[role="button"]');
    for (const player of videoPlayers) {
      const video = player.querySelector('video');
      if (video) addUnique(video as HTMLVideoElement);
    }

    // 4. data-testid="videoComponent" 내부 video
    const videoComponents = element.querySelectorAll('[data-testid="videoComponent"]');
    for (const component of videoComponents) {
      const video = component.querySelector('video');
      if (video) addUnique(video as HTMLVideoElement);
    }

    // 5. 상위 컨테이너에서 video 탐색 (클릭 지점이 하위 요소인 경우)
    const parentVideoComponent = element.closest('[data-testid="videoComponent"]');
    if (parentVideoComponent) {
      const video = parentVideoComponent.querySelector('video');
      if (video) addUnique(video as HTMLVideoElement);
    }

    // 6. 상위 role="button"에서 video 탐색
    const parentPlayer = element.closest('[role="button"]');
    if (parentPlayer) {
      const video = parentPlayer.querySelector('video');
      if (video) addUnique(video as HTMLVideoElement);
    }

    return videos;
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
   * GIF MediaInfo 생성
   * Phase 1-2 (GREEN): GIF 타입 지원 추가
   */
  private createGifMediaInfo(url: string, index: number, tweetInfo?: TweetInfo): MediaInfo {
    return {
      id: `gif_${Date.now()}_${index}`,
      url,
      type: 'gif',
      originalUrl: url,
      filename: this.generateFilename('gif', index, tweetInfo),
      thumbnailUrl: this.generateVideoThumbnail(url),
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
   * Phase 1-2 (GREEN): GIF 확장자 지원 추가
   */
  private generateFilename(type: string, index: number, tweetInfo?: TweetInfo): string {
    const extensionMap: Record<string, string> = {
      image: 'jpg',
      video: 'mp4',
      gif: 'mp4', // Twitter GIF는 mp4로 변환됨
    };
    const extension = extensionMap[type] ?? 'jpg';
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
