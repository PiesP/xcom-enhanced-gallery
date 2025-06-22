/**
 * @fileoverview StableMediaExtractionService - 안정적인 미디어 추출 서비스
 * @description UI 변경에 강건한 미디어 추출 로직과 프로그래매틱 비디오 활성화
 */

import { STABLE_SELECTORS } from '@core/constants/STABLE_SELECTORS';
import type { MediaExtractionResult } from '@core/interfaces/gallery.interfaces';
import type { MediaInfo } from '@core/types/media.types';
import { logger } from '@infrastructure/logging/logger';
import { MediaClickDetector } from '@shared/utils/media/MediaClickDetector';

/**
 * 미디어 추출 옵션
 */
export interface StableExtractionOptions {
  /** 비디오 프로그래매틱 활성화 시도 */
  activateVideos?: boolean;
  /** 최대 대기 시간 (ms) */
  maxWaitTime?: number;
  /** DOM 변경 감지 활성화 */
  observeChanges?: boolean;
  /** 재시도 횟수 */
  retryCount?: number;
}

/**
 * 안정적인 미디어 추출 서비스
 *
 * 핵심 기능:
 * 1. 다중 선택자 전략으로 안정적인 DOM 탐색
 * 2. 프로그래매틱 비디오 플레이어 활성화
 * 3. MutationObserver를 통한 비동기 DOM 변경 감지
 * 4. 강화된 에러 처리 및 폴백 메커니즘
 */
export class StableMediaExtractionService {
  private static instance: StableMediaExtractionService;
  private readonly detector: MediaClickDetector;
  private readonly defaultOptions: Required<StableExtractionOptions> = {
    activateVideos: true,
    maxWaitTime: 3000,
    observeChanges: true,
    retryCount: 3,
  };

  private constructor() {
    this.detector = MediaClickDetector.getInstance();
    logger.debug('[StableMediaExtractionService] 초기화됨');
  }

  public static getInstance(): StableMediaExtractionService {
    StableMediaExtractionService.instance ??= new StableMediaExtractionService();
    return StableMediaExtractionService.instance;
  }

  /**
   * 클릭된 요소에서 안정적인 미디어 추출
   * @param clickedElement 클릭된 DOM 요소
   * @param options 추출 옵션
   * @returns 미디어 추출 결과
   */
  public async extractFromClick(
    clickedElement: HTMLElement,
    options: StableExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    const opts = { ...this.defaultOptions, ...options };

    try {
      logger.debug('[StableMediaExtractionService] 클릭 기반 미디어 추출 시작');

      // 1. 클릭된 요소 분석
      const detection = this.detector.detectMediaFromClick(clickedElement);
      if (detection.type === 'none') {
        logger.warn('[StableMediaExtractionService] 클릭된 요소에서 미디어를 찾을 수 없음');
        return { success: false, mediaItems: [], clickedIndex: -1 };
      }

      // 2. 트윗 컨테이너 찾기
      const tweetContainer = this.findTweetContainer(clickedElement);
      if (!tweetContainer) {
        logger.warn('[StableMediaExtractionService] 트윗 컨테이너를 찾을 수 없음');
        return { success: false, mediaItems: [], clickedIndex: -1 };
      }

      // 3. 비디오 활성화 시도
      if (opts.activateVideos) {
        await this.activateVideosInContainer(tweetContainer, opts.maxWaitTime);
      }

      // 4. 모든 미디어 추출
      const mediaItems = await this.extractAllMediaFromContainer(tweetContainer, opts);

      if (mediaItems.length === 0) {
        logger.warn('[StableMediaExtractionService] 컨테이너에서 미디어를 찾을 수 없음');
        return { success: false, mediaItems: [], clickedIndex: -1 };
      }

      // 5. 클릭된 미디어 인덱스 찾기
      const clickedIndex = this.findClickedMediaIndex(mediaItems, detection.element);

      logger.info(
        `[StableMediaExtractionService] 미디어 추출 완료: ${mediaItems.length}개, 클릭 인덱스: ${clickedIndex}`
      );

      return {
        success: true,
        mediaItems,
        clickedIndex: Math.max(0, clickedIndex),
      };
    } catch (error) {
      logger.error('[StableMediaExtractionService] 미디어 추출 실패:', error);
      return { success: false, mediaItems: [], clickedIndex: -1 };
    }
  }

  /**
   * 컨테이너에서 모든 미디어 추출
   * @param container 트윗 컨테이너
   * @param options 추출 옵션
   * @returns 미디어 정보 배열
   */
  private async extractAllMediaFromContainer(
    container: HTMLElement,
    options: StableExtractionOptions
  ): Promise<MediaInfo[]> {
    const mediaItems: MediaInfo[] = [];
    let retryCount = 0;

    while (retryCount <= (options.retryCount ?? 3)) {
      try {
        // 이미지 추출
        const images = this.extractImagesFromContainer(container);
        mediaItems.push(...images);

        // 비디오 추출
        const videos = await this.extractVideosFromContainer(container, options);
        mediaItems.push(...videos);

        if (mediaItems.length > 0) {
          break;
        }

        retryCount++;
        if (retryCount <= (options.retryCount ?? 3)) {
          logger.debug(`[StableMediaExtractionService] 재시도 ${retryCount}/${options.retryCount}`);
          await this.waitForChanges(container, 500);
        }
      } catch (error) {
        logger.error(`[StableMediaExtractionService] 추출 시도 ${retryCount + 1} 실패:`, error);
        retryCount++;
      }
    }

    // 중복 제거 및 정렬
    return this.deduplicateAndSortMedia(mediaItems);
  }

  /**
   * 트윗 컨테이너 찾기 (안정적인 선택자 사용)
   * @param element 시작 요소
   * @returns 트윗 컨테이너 또는 null
   */
  private findTweetContainer(element: HTMLElement): HTMLElement | null {
    for (const selector of STABLE_SELECTORS.TWEET_CONTAINERS) {
      const container = element.closest(selector) as HTMLElement;
      if (container) {
        logger.debug(`[StableMediaExtractionService] 트윗 컨테이너 발견: ${selector}`);
        return container;
      }
    }
    return null;
  }

  /**
   * 컨테이너 내 비디오 플레이어를 프로그래매틱으로 활성화
   * @param container 트윗 컨테이너
   * @param maxWaitTime 최대 대기 시간
   */
  private async activateVideosInContainer(
    container: HTMLElement,
    maxWaitTime: number
  ): Promise<void> {
    try {
      logger.debug('[StableMediaExtractionService] 비디오 활성화 시작');

      // 플레이 버튼들 찾기
      const playButtons = container.querySelectorAll('[data-testid="playButton"]');

      for (const button of Array.from(playButtons)) {
        try {
          // 프로그래매틱 클릭으로 비디오 활성화
          (button as HTMLElement).click();
          logger.debug('[StableMediaExtractionService] 플레이 버튼 클릭됨');

          // 잠시 대기하여 DOM 업데이트 허용
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          logger.warn('[StableMediaExtractionService] 플레이 버튼 클릭 실패:', error);
        }
      }

      // 비디오 요소가 나타날 때까지 대기
      await this.waitForVideoElements(container, maxWaitTime);
    } catch (error) {
      logger.warn('[StableMediaExtractionService] 비디오 활성화 실패:', error);
    }
  }

  /**
   * 비디오 요소가 나타날 때까지 대기
   * @param container 컨테이너
   * @param maxWaitTime 최대 대기 시간
   */
  private async waitForVideoElements(container: HTMLElement, maxWaitTime: number): Promise<void> {
    return new Promise(resolve => {
      const startTime = Date.now();

      const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            const addedNodes = Array.from(mutation.addedNodes);
            const hasVideo = addedNodes.some(
              node =>
                node.nodeType === Node.ELEMENT_NODE &&
                ((node as Element).tagName === 'VIDEO' || (node as Element).querySelector('video'))
            );

            if (hasVideo) {
              observer.disconnect();
              resolve();
              return;
            }
          }
        }

        if (Date.now() - startTime > maxWaitTime) {
          observer.disconnect();
          resolve();
        }
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
      });

      // 타임아웃 설정
      setTimeout(() => {
        observer.disconnect();
        resolve();
      }, maxWaitTime);
    });
  }

  /**
   * 컨테이너에서 이미지 추출
   * @param container 트윗 컨테이너
   * @returns 이미지 정보 배열
   */
  private extractImagesFromContainer(container: HTMLElement): MediaInfo[] {
    const images: MediaInfo[] = [];

    for (const selector of STABLE_SELECTORS.IMAGE_CONTAINERS) {
      const imageContainers = container.querySelectorAll(selector);

      for (const imgContainer of Array.from(imageContainers)) {
        const img = imgContainer.querySelector('img[src*="twimg.com"]') as HTMLImageElement;
        if (img?.src) {
          const mediaInfo: MediaInfo = {
            id: this.generateMediaId(img.src),
            type: 'image',
            url: this.enhanceImageUrl(img.src),
            thumbnailUrl: img.src,
            originalUrl: img.src,
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height,
            alt: img.alt || '',
            source: 'stable_extraction',
          };

          images.push(mediaInfo);
        }
      }
    }

    return images;
  }

  /**
   * 컨테이너에서 비디오 추출
   * @param container 트윗 컨테이너
   * @param options 추출 옵션
   * @returns 비디오 정보 배열
   */
  private async extractVideosFromContainer(
    container: HTMLElement,
    _options: StableExtractionOptions
  ): Promise<MediaInfo[]> {
    const videos: MediaInfo[] = [];

    for (const selector of STABLE_SELECTORS.MEDIA_PLAYERS) {
      const videoContainers = container.querySelectorAll(selector);

      for (const videoContainer of Array.from(videoContainers)) {
        const video = videoContainer.querySelector('video') as HTMLVideoElement;
        if (video) {
          const videoUrl = video.src || video.currentSrc;
          if (videoUrl) {
            const mediaInfo: MediaInfo = {
              id: this.generateMediaId(videoUrl),
              type: 'video',
              url: videoUrl,
              thumbnailUrl: video.poster || '',
              originalUrl: videoUrl,
              width: video.videoWidth || video.width,
              height: video.videoHeight || video.height,
              duration: video.duration || 0,
              source: 'stable_extraction',
            };

            videos.push(mediaInfo);
          }
        }
      }
    }

    return videos;
  }

  /**
   * DOM 변경 대기
   * @param container 관찰할 컨테이너
   * @param timeout 대기 시간
   */
  private async waitForChanges(container: HTMLElement, timeout: number): Promise<void> {
    return new Promise(resolve => {
      const observer = new MutationObserver(() => {
        observer.disconnect();
        resolve();
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
      });

      setTimeout(() => {
        observer.disconnect();
        resolve();
      }, timeout);
    });
  }

  /**
   * 클릭된 미디어의 인덱스 찾기
   * @param mediaItems 미디어 배열
   * @param clickedElement 클릭된 요소
   * @returns 인덱스 (-1이면 찾지 못함)
   */
  private findClickedMediaIndex(
    mediaItems: MediaInfo[],
    clickedElement: HTMLElement | null
  ): number {
    if (!clickedElement) return -1;

    for (let i = 0; i < mediaItems.length; i++) {
      const media = mediaItems[i];

      // URL 기반 매칭
      if (clickedElement.tagName === 'IMG') {
        const img = clickedElement as HTMLImageElement;
        if (media && (img.src === media.url || img.src === media.thumbnailUrl)) {
          return i;
        }
      }

      if (clickedElement.tagName === 'VIDEO') {
        const video = clickedElement as HTMLVideoElement;
        if (media && (video.src === media.url || video.currentSrc === media.url)) {
          return i;
        }
      }
    }

    return -1;
  }

  /**
   * 미디어 중복 제거 및 정렬
   * @param mediaItems 미디어 배열
   * @returns 정리된 미디어 배열
   */
  private deduplicateAndSortMedia(mediaItems: MediaInfo[]): MediaInfo[] {
    const seen = new Set<string>();
    const unique = mediaItems.filter(item => {
      if (seen.has(item.url)) {
        return false;
      }
      seen.add(item.url);
      return true;
    });

    // 타입별로 정렬 (이미지 먼저, 그 다음 비디오)
    return unique.sort((a, b) => {
      if (a.type === b.type) return 0;
      return a.type === 'image' ? -1 : 1;
    });
  }

  /**
   * 미디어 ID 생성
   * @param url 미디어 URL
   * @returns 고유 ID
   */
  private generateMediaId(url: string): string {
    // URL에서 파일명 추출하여 ID로 사용
    const match = url.match(/\/([^/?]+)(?:\?|$)/);
    return match?.[1] ?? `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 트위터 이미지 URL을 원본 화질로 최적화
   * https://pbs.twimg.com/media/{id}?format={ext}&name=orig 형식으로 변환
   * @param url 원본 이미지 URL
   * @returns 원본 화질 URL
   */
  private enhanceImageUrl(url: string): string {
    try {
      // 트위터 이미지 URL 패턴 확인
      if (!url.includes('pbs.twimg.com/media/')) {
        logger.debug('[StableMediaExtractionService] 트위터 미디어 URL이 아님:', url);
        return url;
      }

      const urlObj = new URL(url);

      // 기존 파라미터에서 format 추출 (없으면 jpg 기본값)
      let format = urlObj.searchParams.get('format') ?? 'jpg';

      // URL에서 확장자 추출 시도
      const pathname = urlObj.pathname;
      const extMatch = pathname.match(/\.(jpg|jpeg|png|webp)$/i);
      if (extMatch?.[1]) {
        format = extMatch[1].toLowerCase();
        // 확장자가 있는 경우 제거하여 깔끔한 URL 생성
        urlObj.pathname = pathname.replace(/\.(jpg|jpeg|png|webp)$/i, '');
      }

      // 원본 화질 파라미터 설정
      urlObj.searchParams.set('format', format);
      urlObj.searchParams.set('name', 'orig');

      const originalUrl = urlObj.toString();
      logger.debug('[StableMediaExtractionService] 이미지 URL 최적화:', {
        original: url,
        optimized: originalUrl,
      });

      return originalUrl;
    } catch (error) {
      logger.warn('[StableMediaExtractionService] 이미지 URL 변환 실패:', error);
      return url;
    }
  }
}
