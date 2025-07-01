/**
 * 미디어 추출 코디네이터
 *
 * 기존 GalleryApp.ts에서 미디어 추출 부분을 분리하여 생성
 *
 * 책임:
 * - 즉시 미디어 추출 (DOM 기반)
 * - 백그라운드 미디어 추출
 * - 추출 상태 관리 및 중복 방지
 * - 순차 실행 제어
 */

import {
  clearAllExtractions,
  getExtractionStateManager,
  hasSuccessfulExtraction,
  recordSuccessfulExtraction,
} from '../../core/state/ExtractionStateManager';
import type { MediaInfo } from '../../core/types/media.types';
import { BackgroundTweetLoader } from '../../features/media/services/BackgroundTweetLoader';
import { UnifiedMediaExtractionService } from '../../features/media/extraction/services/UnifiedMediaExtractionService.v2';
import { HiddenTweetLoaderService } from '../../features/media/services/HiddenTweetLoaderService';
import { logger } from '../../infrastructure/logging/logger';
import { URLPatterns } from '../../shared/utils/patterns/url-patterns';

/**
 * 추출 결과
 */
export interface ExtractionResult {
  success: boolean;
  mediaItems: MediaInfo[];
  clickedIndex: number;
  source: 'immediate' | 'background' | 'fallback';
}

/**
 * 추출 코디네이터 설정
 */
export interface ExtractionCoordinatorConfig {
  timeout?: number;
  enableBackgroundExtraction?: boolean;
  enableFallbackExtraction?: boolean;
}

/**
 * 미디어 추출 코디네이터
 */
export class MediaExtractionCoordinator {
  private config: Required<ExtractionCoordinatorConfig>;

  // 추출 서비스들
  private immediateExtractor: UnifiedMediaExtractionService | null = null;
  private backgroundTweetLoader: BackgroundTweetLoader | null = null;
  private hiddenTweetLoader: HiddenTweetLoaderService | null = null;

  // 순차 실행 제어
  private currentExtractionId: number = 0;

  private isInitialized = false;

  constructor(config: ExtractionCoordinatorConfig = {}) {
    this.config = {
      timeout: config.timeout ?? 15000,
      enableBackgroundExtraction: config.enableBackgroundExtraction ?? true,
      enableFallbackExtraction: config.enableFallbackExtraction ?? true,
    };
  }

  /**
   * 추출 코디네이터 초기화
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.debug('ExtractionCoordinator: Already initialized');
      return;
    }

    try {
      // 즉시 추출 서비스 초기화
      this.immediateExtractor = new UnifiedMediaExtractionService();

      // 백그라운드 추출 서비스들 초기화
      if (this.config.enableBackgroundExtraction) {
        this.backgroundTweetLoader = BackgroundTweetLoader.getInstance();
        this.hiddenTweetLoader = HiddenTweetLoaderService.getInstance();
      }

      this.isInitialized = true;
      logger.info('✅ MediaExtractionCoordinator 초기화 완료');
    } catch (error) {
      logger.error('❌ ExtractionCoordinator 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 클릭된 요소에서 미디어 추출
   */
  public async extractFromClick(
    target: HTMLElement,
    _event: MouseEvent
  ): Promise<ExtractionResult> {
    // 새로운 추출 ID 생성으로 기존 작업 무효화
    const extractionId = ++this.currentExtractionId;

    try {
      logger.debug('미디어 추출 시작:', { extractionId });

      // 1단계: 즉시 추출 시도
      const immediateResult = await this.tryImmediateExtraction(target, extractionId);
      if (immediateResult.success) {
        // 성공 시 모든 백그라운드 작업 무효화
        this.currentExtractionId++;
        return immediateResult;
      }

      // 무효화 확인
      if (this.currentExtractionId !== extractionId) {
        return { success: false, mediaItems: [], clickedIndex: 0, source: 'immediate' };
      }

      // 2단계: 백그라운드 추출 시도
      if (this.config.enableBackgroundExtraction) {
        const backgroundResult = await this.tryBackgroundExtraction(target, extractionId);
        if (backgroundResult.success) {
          return backgroundResult;
        }
      }

      // 3단계: 폴백 추출 시도
      if (this.config.enableFallbackExtraction) {
        const fallbackResult = await this.tryFallbackExtraction(target, extractionId);
        if (fallbackResult.success) {
          return fallbackResult;
        }
      }

      return { success: false, mediaItems: [], clickedIndex: 0, source: 'fallback' };
    } catch (error) {
      logger.error('미디어 추출 실패:', error);
      return { success: false, mediaItems: [], clickedIndex: 0, source: 'immediate' };
    }
  }

  /**
   * 1단계: 즉시 추출 (현재 DOM)
   */
  private async tryImmediateExtraction(
    target: HTMLElement,
    extractionId: number
  ): Promise<ExtractionResult> {
    if (!this.immediateExtractor) {
      return { success: false, mediaItems: [], clickedIndex: 0, source: 'immediate' };
    }

    // 무효화 확인
    if (this.currentExtractionId !== extractionId) {
      return { success: false, mediaItems: [], clickedIndex: 0, source: 'immediate' };
    }

    try {
      logger.debug('즉시 추출 시도');

      const result = await this.immediateExtractor.extractFromClickedElement(target, {
        includeVideos: true,
        enableValidation: true,
        useApiFallback: true,
      });

      if (result.success && result.mediaItems.length > 0) {
        logger.info('✅ 즉시 추출 성공:', {
          mediaCount: result.mediaItems.length,
          clickedIndex: result.clickedIndex,
        });

        return {
          success: true,
          mediaItems: [...result.mediaItems],
          clickedIndex: result.clickedIndex ?? 0,
          source: 'immediate',
        };
      }

      return { success: false, mediaItems: [], clickedIndex: 0, source: 'immediate' };
    } catch (error) {
      logger.debug('즉시 추출 실패:', error);
      return { success: false, mediaItems: [], clickedIndex: 0, source: 'immediate' };
    }
  }

  /**
   * 2단계: 백그라운드 추출
   */
  private async tryBackgroundExtraction(
    target: HTMLElement,
    extractionId: number
  ): Promise<ExtractionResult> {
    if (!this.config.enableBackgroundExtraction) {
      return { success: false, mediaItems: [], clickedIndex: 0, source: 'background' };
    }

    // 무효화 확인
    if (this.currentExtractionId !== extractionId) {
      return { success: false, mediaItems: [], clickedIndex: 0, source: 'background' };
    }

    try {
      // 트윗 정보 추출
      const tweetInfo = this.extractTweetInfo(target);
      if (!tweetInfo) {
        return { success: false, mediaItems: [], clickedIndex: 0, source: 'background' };
      }

      // 중복 추출 방지
      if (hasSuccessfulExtraction(tweetInfo.tweetId)) {
        logger.debug('이미 성공한 추출이므로 건너뛰기:', tweetInfo.tweetId);
        return { success: false, mediaItems: [], clickedIndex: 0, source: 'background' };
      }

      logger.debug('백그라운드 추출 시작:', tweetInfo);

      // HiddenTweetLoader 우선 시도
      const hiddenResult = await this.tryHiddenTweetLoader(tweetInfo, extractionId);
      if (hiddenResult.success) {
        return hiddenResult;
      }

      // 무효화 재확인
      if (this.currentExtractionId !== extractionId) {
        return { success: false, mediaItems: [], clickedIndex: 0, source: 'background' };
      }

      // BackgroundTweetLoader 시도
      const backgroundResult = await this.tryBackgroundTweetLoader(tweetInfo, extractionId);
      if (backgroundResult.success) {
        return backgroundResult;
      }

      return { success: false, mediaItems: [], clickedIndex: 0, source: 'background' };
    } catch (error) {
      logger.debug('백그라운드 추출 실패:', error);
      return { success: false, mediaItems: [], clickedIndex: 0, source: 'background' };
    }
  }

  /**
   * 3단계: 폴백 추출 (DOM 기반)
   */
  private async tryFallbackExtraction(
    target: HTMLElement,
    extractionId: number
  ): Promise<ExtractionResult> {
    // 무효화 확인
    if (this.currentExtractionId !== extractionId) {
      return { success: false, mediaItems: [], clickedIndex: 0, source: 'fallback' };
    }

    try {
      logger.debug('폴백 추출 시도');

      // 트윗 컨테이너 찾기
      const tweetContainer = this.findTweetContainer(target);
      if (!tweetContainer) {
        return { success: false, mediaItems: [], clickedIndex: 0, source: 'fallback' };
      }

      // 트윗 ID 추출
      const tweetId = this.extractTweetIdFromContainer(tweetContainer);

      // 컨테이너에서 직접 미디어 추출
      const mediaItems = this.extractMediaFromContainer(tweetContainer, tweetId);

      if (mediaItems.length > 0) {
        logger.info('✅ 폴백 추출 성공:', {
          mediaCount: mediaItems.length,
          tweetId,
        });

        // 성공 기록
        if (tweetId) {
          recordSuccessfulExtraction(tweetId, mediaItems.length);
        }

        return {
          success: true,
          mediaItems,
          clickedIndex: 0,
          source: 'fallback',
        };
      }

      return { success: false, mediaItems: [], clickedIndex: 0, source: 'fallback' };
    } catch (error) {
      logger.debug('폴백 추출 실패:', error);
      return { success: false, mediaItems: [], clickedIndex: 0, source: 'fallback' };
    }
  }

  /**
   * HiddenTweetLoader 시도
   */
  private async tryHiddenTweetLoader(
    tweetInfo: { tweetId: string; mediaIndex?: number | undefined },
    extractionId: number
  ): Promise<ExtractionResult> {
    if (!this.hiddenTweetLoader) {
      return { success: false, mediaItems: [], clickedIndex: 0, source: 'background' };
    }

    try {
      // 무효화 확인
      if (this.currentExtractionId !== extractionId) {
        return { success: false, mediaItems: [], clickedIndex: 0, source: 'background' };
      }

      const result = await this.hiddenTweetLoader.extractMediaFromTweet(tweetInfo.tweetId, {
        timeout: this.config.timeout,
        enableCache: true,
        waitForMedia: true,
      });

      // 결과 처리 전 재확인
      if (this.currentExtractionId !== extractionId) {
        return { success: false, mediaItems: [], clickedIndex: 0, source: 'background' };
      }

      if (result.success && result.mediaItems.length > 0) {
        logger.info('✅ HiddenTweetLoader 성공');

        // 성공 기록
        recordSuccessfulExtraction(tweetInfo.tweetId, result.mediaItems.length);

        return {
          success: true,
          mediaItems: [...result.mediaItems],
          clickedIndex: tweetInfo.mediaIndex ?? 0,
          source: 'background',
        };
      }

      return { success: false, mediaItems: [], clickedIndex: 0, source: 'background' };
    } catch (error) {
      logger.debug('HiddenTweetLoader 실패:', error);
      return { success: false, mediaItems: [], clickedIndex: 0, source: 'background' };
    }
  }

  /**
   * BackgroundTweetLoader 시도
   */
  private async tryBackgroundTweetLoader(
    tweetInfo: { tweetId: string; mediaIndex?: number | undefined },
    extractionId: number
  ): Promise<ExtractionResult> {
    if (!this.backgroundTweetLoader) {
      return { success: false, mediaItems: [], clickedIndex: 0, source: 'background' };
    }

    try {
      // 무효화 확인
      if (this.currentExtractionId !== extractionId) {
        return { success: false, mediaItems: [], clickedIndex: 0, source: 'background' };
      }

      const result = await this.backgroundTweetLoader.loadMediaFromTweet(tweetInfo.tweetId, {
        timeout: this.config.timeout,
        enableFallback: true,
        targetMediaIndex: tweetInfo.mediaIndex ?? undefined,
      });

      // 결과 처리 전 재확인
      if (this.currentExtractionId !== extractionId) {
        return { success: false, mediaItems: [], clickedIndex: 0, source: 'background' };
      }

      if (result.success && result.mediaItems.length > 0) {
        logger.info('✅ BackgroundTweetLoader 성공');

        // 성공 기록
        recordSuccessfulExtraction(tweetInfo.tweetId, result.mediaItems.length);

        return {
          success: true,
          mediaItems: [...result.mediaItems],
          clickedIndex: tweetInfo.mediaIndex ?? 0,
          source: 'background',
        };
      }

      return { success: false, mediaItems: [], clickedIndex: 0, source: 'background' };
    } catch (error) {
      logger.debug('BackgroundTweetLoader 실패:', error);
      return { success: false, mediaItems: [], clickedIndex: 0, source: 'background' };
    }
  }

  /**
   * 트윗 정보 추출
   */
  private extractTweetInfo(
    target: HTMLElement
  ): { tweetId: string; mediaIndex?: number | undefined } | null {
    // 미디어 그리드 링크에서 추출
    const link = target.closest('a[href*="/status/"]') as HTMLAnchorElement;
    if (link) {
      const href = link.getAttribute('href') ?? link.href;
      const fullUrl = URLPatterns.makeAbsoluteUrl(href);
      const tweetId = URLPatterns.extractTweetId(fullUrl);

      if (tweetId) {
        const mediaIndex = URLPatterns.extractMediaIndexFromLink(href);
        return { tweetId, mediaIndex: mediaIndex ?? undefined };
      }
    }

    // 트윗 컨테이너에서 추출
    const tweetContainer = this.findTweetContainer(target);
    if (tweetContainer) {
      const tweetId = this.extractTweetIdFromContainer(tweetContainer);
      if (tweetId) {
        return { tweetId };
      }
    }

    return null;
  }

  /**
   * 트윗 컨테이너 찾기
   */
  private findTweetContainer(target: HTMLElement): HTMLElement | null {
    // 다양한 방법으로 트윗 컨테이너 찾기
    const selectors = ['[data-testid="tweet"]', 'article', '[data-tweet-id]'];

    for (const selector of selectors) {
      const container = target.closest(selector);
      if (container) {
        return container as HTMLElement;
      }
    }

    // 수동 탐색
    let parent = target.parentElement;
    let depth = 0;

    while (parent && depth < 10) {
      if (
        parent.getAttribute('data-testid') === 'tweet' ||
        parent.tagName === 'ARTICLE' ||
        parent.querySelector('a[href*="/status/"]')
      ) {
        return parent;
      }
      parent = parent.parentElement;
      depth++;
    }

    return null;
  }

  /**
   * 트윗 컨테이너에서 트윗 ID 추출
   */
  private extractTweetIdFromContainer(container: HTMLElement): string | null {
    // data-tweet-id 속성
    const tweetId = container.getAttribute('data-tweet-id');
    if (tweetId) return tweetId;

    // 링크에서 추출
    const link = container.querySelector('a[href*="/status/"]') as HTMLAnchorElement;
    if (link) {
      const match = link.href.match(/\/status\/(\d+)/);
      if (match?.[1]) return match[1];
    }

    return null;
  }

  /**
   * 컨테이너에서 미디어 추출
   */
  private extractMediaFromContainer(container: HTMLElement, tweetId?: string | null): MediaInfo[] {
    const mediaItems: MediaInfo[] = [];
    let mediaIndex = 0;

    try {
      // 이미지 추출
      const images = container.querySelectorAll('img[src*="pbs.twimg.com"]');
      for (const img of images) {
        const imgElement = img as HTMLImageElement;
        const src = imgElement.src;

        if (this.isValidMediaImage(src)) {
          mediaItems.push({
            id: `${tweetId ?? 'unknown'}-${mediaIndex}`,
            type: 'image',
            url: this.normalizeImageUrl(src),
            thumbnailUrl: this.getThumbnailUrl(src),
            originalUrl: this.normalizeImageUrl(src),
            tweetId: tweetId || undefined,
            filename: `media_${mediaIndex}.jpg`,
            alt: imgElement.alt ?? 'Media image',
          });
          mediaIndex++;
        }
      }

      // 비디오 추출
      const videos = container.querySelectorAll('video[src*="video.twimg.com"]');
      for (const video of videos) {
        const videoElement = video as HTMLVideoElement;
        const src = videoElement.src;

        if (src) {
          mediaItems.push({
            id: `${tweetId ?? 'unknown'}-${mediaIndex}`,
            type: 'video',
            url: src,
            thumbnailUrl: this.getVideoThumbnail(src),
            originalUrl: src,
            tweetId: tweetId || undefined,
            filename: `video_${mediaIndex}.mp4`,
            alt: 'Media video',
          });
          mediaIndex++;
        }
      }
    } catch (error) {
      logger.debug('컨테이너 미디어 추출 실패:', error);
    }

    return mediaItems;
  }

  /**
   * 유효한 미디어 이미지인지 확인
   */
  private isValidMediaImage(url: string): boolean {
    if (!url?.includes('pbs.twimg.com')) return false;

    const excludePatterns = ['profile_images', 'profile_banners', 'emoji'];
    return !excludePatterns.some(pattern => url.includes(pattern));
  }

  /**
   * 이미지 URL 정규화
   */
  private normalizeImageUrl(url: string): string {
    try {
      const baseUrl = url.split('?')[0];
      return `${baseUrl}?format=jpg&name=large`;
    } catch {
      return url;
    }
  }

  /**
   * 썸네일 URL 생성
   */
  private getThumbnailUrl(url: string): string {
    return this.normalizeImageUrl(url).replace('name=large', 'name=small');
  }

  /**
   * 비디오 썸네일 생성
   */
  private getVideoThumbnail(videoUrl: string): string {
    try {
      const urlParts = videoUrl.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      if (!lastPart) return '';

      const videoId = lastPart.split('.')[0];
      return `https://pbs.twimg.com/ext_tw_video_thumb/${videoId}/pu/img/placeholder.jpg`;
    } catch {
      return '';
    }
  }

  /**
   * 추출 상태 정리
   */
  public clearExtractionState(): void {
    clearAllExtractions();
    logger.debug('추출 상태 정리 완료');
  }

  /**
   * 설정 업데이트
   */
  public updateConfig(newConfig: Partial<ExtractionCoordinatorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.debug('추출 코디네이터 설정 업데이트됨');
  }

  /**
   * 진단 정보
   */
  public getDiagnostics() {
    const extractionManager = getExtractionStateManager();

    return {
      isInitialized: this.isInitialized,
      config: this.config,
      currentExtractionId: this.currentExtractionId,
      extractionState: extractionManager.getDebugInfo(),
      activeServices: {
        immediateExtractor: !!this.immediateExtractor,
        backgroundTweetLoader: !!this.backgroundTweetLoader,
        hiddenTweetLoader: !!this.hiddenTweetLoader,
      },
    };
  }

  /**
   * 정리
   */
  public async cleanup(): Promise<void> {
    try {
      // 추출 상태 정리
      this.clearExtractionState();

      // 서비스 정리
      this.immediateExtractor = null;
      this.backgroundTweetLoader = null;
      this.hiddenTweetLoader = null;

      // 상태 초기화
      this.currentExtractionId = 0;
      this.isInitialized = false;

      logger.debug('MediaExtractionCoordinator 정리 완료');
    } catch (error) {
      logger.error('추출 코디네이터 정리 실패:', error);
    }
  }
}
