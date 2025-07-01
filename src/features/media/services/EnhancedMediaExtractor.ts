/**
 * @deprecated 이 서비스는 더 이상 사용되지 않습니다.
 * UnifiedMediaExtractionService를 사용하세요.
 *
 * @fileoverview Enhanced Media Extractor Service
 * @description 현재 페이지와 백그라운드 로딩을 결합한 강화된 미디어 추출 서비스
 */

import { BACKGROUND_EXTRACTION } from '@core/constants/MEDIA_CONSTANTS';
import type { MediaExtractionResult, MediaExtractor } from '@core/interfaces/gallery.interfaces';
import type { MediaInfo } from '@core/types/media.types';
import { logger } from '@infrastructure/logging/logger';
import { TweetExtractionService } from '@shared/utils/patterns/tweet-extraction/TweetExtractionService';
import type { TweetInfo } from '@shared/utils/patterns/tweet-extraction/types';
import { UrlBasedStrategy } from '@shared/utils/patterns/tweet-extraction/UrlBasedStrategy';
import { BackgroundTweetLoader } from './BackgroundTweetLoader';

export interface MediaExtractionOptions {
  /** 백그라운드 로딩 활성화 */
  enableBackgroundLoading?: boolean;
  /** 타임아웃 (밀리초) */
  timeout?: number;
  /** 비디오 포함 여부 */
  includeVideos?: boolean;
  /** API 폴백 사용 여부 */
  useApiFallback?: boolean;
  /** 미디어 검증 활성화 */
  enableValidation?: boolean;
}

export interface EnhancedExtractionResult {
  success: boolean;
  mediaItems: MediaInfo[];
  clickedIndex: number;
  source: 'current-page' | 'background-loaded' | 'combined';
  tweetInfo?: TweetInfo;
  fromBackground?: boolean;
  error?: string;
}

/**
 * 강화된 미디어 추출 서비스
 * 현재 페이지 추출과 백그라운드 로딩을 결합하여 모든 미디어 추출
 */
export class EnhancedMediaExtractor implements MediaExtractor {
  private readonly tweetExtractionService: TweetExtractionService;
  private readonly backgroundLoader: BackgroundTweetLoader;

  constructor() {
    this.tweetExtractionService = new TweetExtractionService();
    this.backgroundLoader = BackgroundTweetLoader.getInstance();
  }

  /**
   * MediaExtractor 인터페이스 구현 - 클릭된 요소에서 추출
   */
  async extractFromClickedElement(
    element: HTMLElement,
    options?: {
      includeVideos?: boolean;
      useApiFallback?: boolean;
      enableValidation?: boolean;
      timeoutMs?: number;
    }
  ): Promise<MediaExtractionResult> {
    const extractionOptions: MediaExtractionOptions = {
      enableBackgroundLoading: true,
      timeout: options?.timeoutMs ?? BACKGROUND_EXTRACTION.DEFAULT_TIMEOUT,
      includeVideos: options?.includeVideos ?? true,
      useApiFallback: options?.useApiFallback ?? true,
      enableValidation: options?.enableValidation ?? true,
    };

    const result = await this.extractWithEnhancedLogic(element, extractionOptions);

    return {
      success: result.success,
      mediaItems: result.mediaItems,
      clickedIndex: result.clickedIndex,
      error: result.success ? undefined : 'Enhanced extraction failed',
      metadata: {
        sourceType: result.fromBackground ? 'tweet' : 'media',
        strategy: result.source,
        totalProcessingTime: 0, // TODO: 실제 시간 측정
      },
      tweetInfo: result.tweetInfo ?? null,
    };
  }

  /**
   * MediaExtractor 인터페이스 구현 - 컨테이너에서 전체 추출
   */
  async extractAllFromContainer(
    container: HTMLElement,
    options?: {
      includeVideos?: boolean;
      useApiFallback?: boolean;
      enableValidation?: boolean;
      timeoutMs?: number;
    }
  ): Promise<MediaExtractionResult> {
    const extractionOptions: MediaExtractionOptions = {
      enableBackgroundLoading: true,
      timeout: options?.timeoutMs ?? BACKGROUND_EXTRACTION.DEFAULT_TIMEOUT,
      includeVideos: options?.includeVideos ?? true,
      useApiFallback: options?.useApiFallback ?? true,
      enableValidation: options?.enableValidation ?? true,
    };

    // 컨테이너의 첫 번째 요소를 클릭된 요소로 가정
    const firstElement = (container.querySelector('img, video') as HTMLElement) ?? container;
    const result = await this.extractWithEnhancedLogic(firstElement, extractionOptions);

    return {
      success: result.success,
      mediaItems: result.mediaItems,
      clickedIndex: 0, // 컨테이너 추출에서는 첫 번째 미디어를 기본값으로
      error: result.success ? undefined : 'Enhanced container extraction failed',
      metadata: {
        sourceType: result.fromBackground ? 'tweet' : 'media',
        strategy: result.source,
        totalProcessingTime: 0, // TODO: 실제 시간 측정
      },
      tweetInfo: result.tweetInfo ?? null,
    };
  }

  /**
   * 클릭된 요소에서 향상된 미디어 추출 (내부 메서드)
   */
  async extractWithEnhancedLogic(
    element: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<EnhancedExtractionResult> {
    const startTime = Date.now();
    const {
      enableBackgroundLoading = BACKGROUND_EXTRACTION.AUTO_DETECT_ENABLED,
      timeout = BACKGROUND_EXTRACTION.DEFAULT_TIMEOUT,
      includeVideos = true,
      useApiFallback = true,
      enableValidation = true,
    } = options;

    try {
      logger.debug('[EnhancedMediaExtractor] 미디어 추출 시작', {
        enableBackgroundLoading,
        timeout,
        includeVideos,
        useApiFallback,
        enableValidation,
        elementTag: element.tagName,
        elementId: element.id,
        timestamp: new Date().toISOString(),
      });

      // 1. 트윗 컨테이너 찾기
      const tweetContainer = this.findTweetContainer(element);
      if (!tweetContainer) {
        const errorMsg = 'Tweet container not found';
        logger.warn('[EnhancedMediaExtractor] 트윗 컨테이너를 찾을 수 없음', {
          elementTag: element.tagName,
          elementClass: element.className,
          processingTime: Date.now() - startTime,
        });
        return this.createFailureResult(errorMsg);
      }

      // 2. 트윗 정보 추출
      const tweetInfo = this.tweetExtractionService.extractTweetInfo(tweetContainer, element);
      if (!tweetInfo) {
        const errorMsg = 'Tweet info extraction failed';
        logger.warn('[EnhancedMediaExtractor] 트윗 정보 추출 실패', {
          containerTag: tweetContainer.tagName,
          containerClass: tweetContainer.className,
          processingTime: Date.now() - startTime,
        });
        return this.createFailureResult(errorMsg);
      }

      logger.debug('[EnhancedMediaExtractor] 트윗 정보 추출 성공', {
        tweetId: tweetInfo.tweetId,
        username: tweetInfo.username,
        extractionMethod: tweetInfo.extractionMethod,
        processingTime: Date.now() - startTime,
      });

      // 3. 현재 페이지에서 미디어 추출 시도
      const currentPageResult = await this.extractFromCurrentPage(tweetContainer, element, {
        includeVideos,
        useApiFallback,
        enableValidation,
      });

      logger.debug('[EnhancedMediaExtractor] 현재 페이지 추출 완료', {
        success: currentPageResult.success,
        mediaCount: currentPageResult.mediaItems.length,
        clickedIndex: currentPageResult.clickedIndex,
        processingTime: Date.now() - startTime,
      });

      // 4. 백그라운드 로딩 필요성 판단
      const needsBackgroundLoading = this.shouldUseBackgroundLoading(
        currentPageResult,
        enableBackgroundLoading
      );

      if (!needsBackgroundLoading) {
        logger.debug('[EnhancedMediaExtractor] 현재 페이지 결과 사용', {
          reason: 'Background loading not needed',
          mediaCount: currentPageResult.mediaItems.length,
          totalProcessingTime: Date.now() - startTime,
        });
        return {
          ...currentPageResult,
          tweetInfo,
          fromBackground: false,
        };
      }

      // 5. 백그라운드에서 전체 미디어 로드
      logger.debug('[EnhancedMediaExtractor] 백그라운드 로딩 시작');
      const backgroundResult = await this.extractFromBackground(tweetInfo, {
        timeout,
        includeVideos,
        useApiFallback,
        enableValidation,
      });

      // 6. 결과 결합 및 반환
      return this.combineResults(currentPageResult, backgroundResult, tweetInfo);
    } catch (error) {
      logger.error('[EnhancedMediaExtractor] 추출 중 오류:', error);
      return this.createFailureResult();
    }
  }

  /**
   * 현재 페이지에서 미디어 추출
   */
  private async extractFromCurrentPage(
    tweetContainer: HTMLElement,
    clickedElement: HTMLElement,
    _options: { includeVideos: boolean; useApiFallback: boolean; enableValidation: boolean }
  ): Promise<EnhancedExtractionResult> {
    try {
      // 현재 페이지 미디어 추출 로직
      // TODO: 기존 MediaExtractionService 사용
      const mediaItems: MediaInfo[] = [];
      let clickedIndex = 0;

      // 간단한 이미지 추출 예시
      const images = tweetContainer.querySelectorAll('img[src*="pbs.twimg.com"]');
      images.forEach((img, index) => {
        const imgElement = img as HTMLImageElement;
        if (imgElement.src) {
          mediaItems.push({
            id: `img_${index}`,
            url: imgElement.src.replace(/&name=\w+/, '&name=orig'),
            type: 'image',
            originalUrl: imgElement.src.replace(/&name=\w+/, '&name=orig'),
          });

          if (imgElement === clickedElement || imgElement.contains(clickedElement)) {
            clickedIndex = index;
          }
        }
      });

      return {
        success: mediaItems.length > 0,
        mediaItems,
        clickedIndex,
        source: 'current-page',
      };
    } catch (error) {
      logger.error('[EnhancedMediaExtractor] 현재 페이지 추출 실패:', error);
      return this.createFailureResult();
    }
  }

  /**
   * 백그라운드에서 미디어 추출
   */
  private async extractFromBackground(
    tweetInfo: TweetInfo,
    _options: {
      timeout: number;
      includeVideos: boolean;
      useApiFallback: boolean;
      enableValidation: boolean;
    }
  ): Promise<EnhancedExtractionResult> {
    try {
      const result = await this.backgroundLoader.loadMediaFromTweet(tweetInfo.tweetId, {
        timeout: _options.timeout,
        enableFallback: _options.useApiFallback,
      });

      if (result.success && result.mediaItems.length > 0) {
        return {
          success: true,
          mediaItems: result.mediaItems,
          clickedIndex: 0,
          source: 'background-loaded',
          fromBackground: true,
        };
      }

      return this.createFailureResult();
    } catch (error) {
      logger.error('[EnhancedMediaExtractor] 백그라운드 추출 실패:', error);
      return this.createFailureResult();
    }
  }

  /**
   * 백그라운드 로딩 필요성 판단
   */
  private shouldUseBackgroundLoading(
    currentPageResult: EnhancedExtractionResult,
    enableBackgroundLoading: boolean
  ): boolean {
    if (!enableBackgroundLoading) {
      return false;
    }

    // URL 패턴 기반 판단
    if (UrlBasedStrategy.needsBackgroundLoading()) {
      logger.debug('[EnhancedMediaExtractor] URL 패턴에 의한 백그라운드 로딩 필요');
      return true;
    }

    // 현재 페이지에서 추출된 미디어가 1개 이하인 경우
    if (currentPageResult.mediaItems.length <= 1) {
      logger.debug('[EnhancedMediaExtractor] 미디어 부족으로 백그라운드 로딩 필요');
      return true;
    }

    return false;
  }

  /**
   * 현재 페이지와 백그라운드 결과 결합
   */
  private combineResults(
    currentPageResult: EnhancedExtractionResult,
    backgroundResult: EnhancedExtractionResult,
    tweetInfo: TweetInfo
  ): EnhancedExtractionResult {
    // 백그라운드 결과가 더 많은 미디어를 가지고 있으면 우선 사용
    if (
      backgroundResult.success &&
      backgroundResult.mediaItems.length > currentPageResult.mediaItems.length
    ) {
      logger.debug('[EnhancedMediaExtractor] 백그라운드 결과 우선 사용', {
        currentCount: currentPageResult.mediaItems.length,
        backgroundCount: backgroundResult.mediaItems.length,
      });

      return {
        ...backgroundResult,
        source: 'combined',
        tweetInfo,
        fromBackground: true,
      };
    }

    // 현재 페이지 결과 사용
    logger.debug('[EnhancedMediaExtractor] 현재 페이지 결과 사용');
    return {
      ...currentPageResult,
      tweetInfo,
      fromBackground: false,
    };
  }

  /**
   * 트윗 컨테이너 찾기
   */
  private findTweetContainer(element: HTMLElement): HTMLElement | null {
    return element.closest('[data-testid="tweet"], article') as HTMLElement;
  }

  /**
   * 실패 결과 생성
   */
  private createFailureResult(errorMessage?: string): EnhancedExtractionResult {
    const result: EnhancedExtractionResult = {
      success: false,
      mediaItems: [],
      clickedIndex: 0,
      source: 'current-page',
    };

    if (errorMessage) {
      result.error = errorMessage;
    }

    return result;
  }

  /**
   * 정리
   */
  cleanup(): void {
    logger.debug('[EnhancedMediaExtractor] 정리 완료');
  }
}
