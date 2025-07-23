/**
 * @fileoverview 백업 추출기
 * @description API 추출이 실패했을 때 DOM 기반 추출
 * @version 2.0.0 - Clean Architecture
 */

import { logger } from '@core/logging/logger';
import type {
  TweetInfo,
  MediaExtractionResult,
  MediaExtractionOptions,
} from '../interfaces/extraction.interfaces';
import { UnifiedFallbackStrategy } from '../strategies/fallback/UnifiedFallbackStrategy';

/**
 * 백업 추출기
 * API 추출이 실패했을 때 DOM 기반 추출
 */
export class FallbackExtractor {
  private readonly strategy: UnifiedFallbackStrategy;

  constructor() {
    this.strategy = new UnifiedFallbackStrategy();
  }

  /**
   * 백업 추출 실행
   */
  async extract(
    element: HTMLElement,
    _options: MediaExtractionOptions,
    extractionId: string,
    tweetInfo?: TweetInfo
  ): Promise<MediaExtractionResult> {
    logger.debug(`[FallbackExtractor] ${extractionId}: 백업 추출 시작`);

    const tweetContainer = this.findTweetContainer(element);
    if (!tweetContainer) {
      return this.createFailureResult('Tweet container not found');
    }

    try {
      const result = await this.strategy.extract(tweetContainer, element, tweetInfo);

      if (result.success && result.mediaItems.length > 0) {
        logger.info(
          `[FallbackExtractor] ${extractionId}: 통합 전략 성공 - ${result.mediaItems.length}개 미디어`
        );
        return {
          ...result,
          metadata: {
            ...result.metadata,
            extractionId,
            extractedAt: Date.now(),
            sourceType: 'fallback',
            strategy: this.strategy.name,
          },
        };
      }
    } catch (error) {
      logger.warn(`[FallbackExtractor] ${extractionId}: 통합 전략 실패:`, error);
    }

    logger.warn(`[FallbackExtractor] ${extractionId}: 백업 추출 실패`);
    return this.createFailureResult('Fallback strategy failed');
  }

  /**
   * 트윗 컨테이너 찾기
   */
  private findTweetContainer(element: HTMLElement): HTMLElement | null {
    // 통합된 트윗 컨테이너 찾기 로직
    return element.closest('[data-testid="tweet"], article') as HTMLElement;
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
        sourceType: 'fallback',
        strategy: 'fallback-failed',
        error,
      },
      tweetInfo: null,
    };
  }
}
