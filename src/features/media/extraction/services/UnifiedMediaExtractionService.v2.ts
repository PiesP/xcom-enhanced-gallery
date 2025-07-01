/**
 * @fileoverview 통합 미디어 추출 서비스
 * @description 일관된 추출 전략을 모든 페이지에서 적용하는 메인 서비스
 * @version 2.0.0 - Unified Architecture
 */

import { logger } from '../../../../infrastructure/logging/logger';
import type {
  MediaExtractionResult,
  MediaExtractionOptions,
  UnifiedMediaExtractor,
  TweetInfo,
} from '../interfaces/extraction.interfaces';
import { TweetInfoExtractor } from './TweetInfoExtractor';
import { TwitterAPIExtractor } from './TwitterAPIExtractor';
import { FallbackExtractor } from './FallbackExtractor';

/**
 * 통합 미디어 추출 서비스
 * 일관된 추출 전략을 모든 페이지에서 적용
 */
export class UnifiedMediaExtractionService implements UnifiedMediaExtractor {
  private readonly tweetInfoExtractor: TweetInfoExtractor;
  private readonly apiExtractor: TwitterAPIExtractor;
  private readonly fallbackExtractor: FallbackExtractor;

  constructor() {
    this.tweetInfoExtractor = new TweetInfoExtractor();
    this.apiExtractor = new TwitterAPIExtractor();
    this.fallbackExtractor = new FallbackExtractor();
  }

  /**
   * 통합 추출 메인 메서드
   * 1. 트윗 정보 추출 (최우선)
   * 2. API 우선 추출
   * 3. 백업 전략 (DOM 기반)
   */
  async extractFromClickedElement(
    element: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    const extractionId = this.generateExtractionId();
    logger.info(`[UnifiedExtraction] Starting extraction ${extractionId}`);

    try {
      // 1단계: 트윗 정보 추출 (최우선)
      const tweetInfo = await this.extractTweetInfo(element);
      if (!tweetInfo?.tweetId) {
        logger.warn(
          `[UnifiedExtraction] ${extractionId}: 트윗 정보 추출 실패 - 백업 전략으로 진행`
        );
        return this.fallbackExtraction(element, options, extractionId);
      }

      logger.info(`[UnifiedExtraction] ${extractionId}: 트윗 정보 추출 성공`, {
        tweetId: tweetInfo.tweetId,
        username: tweetInfo.username,
        extractionMethod: tweetInfo.extractionMethod,
      });

      // 2단계: API 우선 추출
      const apiResult = await this.apiExtraction(tweetInfo, element, options, extractionId);
      if (apiResult.success && apiResult.mediaItems.length > 0) {
        logger.info(
          `[UnifiedExtraction] ${extractionId}: API 추출 성공 - ${apiResult.mediaItems.length}개 미디어`
        );
        return apiResult;
      }

      logger.warn(`[UnifiedExtraction] ${extractionId}: API 추출 실패 - 백업 전략으로 진행`);

      // 3단계: 백업 전략
      return this.fallbackExtraction(element, options, extractionId, tweetInfo);
    } catch (error) {
      logger.error(`[UnifiedExtraction] ${extractionId}: 추출 중 오류:`, error);
      return this.createErrorResult(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * 컨테이너에서 모든 미디어 추출
   */
  async extractAllFromContainer(
    container: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    const extractionId = this.generateExtractionId();
    logger.info(`[UnifiedExtraction] Container extraction ${extractionId}`);

    try {
      // 컨테이너 내 첫 번째 미디어 요소를 클릭된 요소로 가정
      const firstMediaElement = container.querySelector('img, video') as HTMLElement;
      if (!firstMediaElement) {
        return this.createErrorResult('No media elements found in container');
      }

      return this.extractFromClickedElement(firstMediaElement, options);
    } catch (error) {
      logger.error(`[UnifiedExtraction] ${extractionId}: 컨테이너 추출 오류:`, error);
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Container extraction failed'
      );
    }
  }

  /**
   * 1단계: 트윗 정보 추출
   */
  private async extractTweetInfo(element: HTMLElement): Promise<TweetInfo | null> {
    return this.tweetInfoExtractor.extract(element);
  }

  /**
   * 2단계: API 우선 추출
   */
  private async apiExtraction(
    tweetInfo: TweetInfo,
    clickedElement: HTMLElement,
    options: MediaExtractionOptions,
    extractionId: string
  ): Promise<MediaExtractionResult> {
    return this.apiExtractor.extract(tweetInfo, clickedElement, options, extractionId);
  }

  /**
   * 3단계: 백업 전략
   */
  private async fallbackExtraction(
    element: HTMLElement,
    options: MediaExtractionOptions,
    extractionId: string,
    tweetInfo?: TweetInfo
  ): Promise<MediaExtractionResult> {
    return this.fallbackExtractor.extract(element, options, extractionId, tweetInfo);
  }

  /**
   * 추출 ID 생성
   */
  private generateExtractionId(): string {
    return `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 오류 결과 생성
   */
  private createErrorResult(error: string): MediaExtractionResult {
    return {
      success: false,
      mediaItems: [],
      clickedIndex: 0,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'unknown',
        strategy: 'unified-extraction-error',
        error,
      },
      tweetInfo: null,
    };
  }
}
