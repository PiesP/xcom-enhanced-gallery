/**
 * @fileoverview 통합 미디어 추출기
 * @version 3.1.0 - Simplified Architecture
 *
 * UnifiedFallbackStrategy를 활용한 단순화된 미디어 추출기
 * 중복된 로직을 제거하고 통합 전략을 사용합니다.
 */

import { logger } from '@core/logging/logger';
import type { TweetInfo, FallbackExtractionStrategy } from '@core/types/extraction.types';
import type { MediaExtractionResult } from '@core/types/media.types';
import { UnifiedFallbackStrategy } from '@core/services/media-extraction/strategies/fallback/UnifiedFallbackStrategy';

/**
 * 통합 미디어 추출기
 *
 * UnifiedFallbackStrategy를 wrapper하는 단순화된 클래스
 */
export class MediaExtractor implements FallbackExtractionStrategy {
  readonly name = 'media-extractor';
  private readonly strategy: UnifiedFallbackStrategy;

  constructor() {
    this.strategy = new UnifiedFallbackStrategy();
  }

  async extract(
    tweetContainer: HTMLElement,
    clickedElement: HTMLElement,
    tweetInfo?: TweetInfo
  ): Promise<MediaExtractionResult> {
    try {
      logger.debug('[MediaExtractor] 통합 전략을 사용한 미디어 추출 시작');

      const result = await this.strategy.extract(tweetContainer, clickedElement, tweetInfo);

      if (result.success && result.mediaItems.length > 0) {
        logger.info(`[MediaExtractor] 추출 성공 - ${result.mediaItems.length}개 미디어`);
        return {
          ...result,
          metadata: {
            ...result.metadata,
            strategy: this.name,
            sourceType: 'extractor',
          },
        };
      }

      logger.debug('[MediaExtractor] 미디어를 찾을 수 없음');
      return result;
    } catch (error) {
      logger.error('[MediaExtractor] 추출 오류:', error);
      return {
        success: false,
        mediaItems: [],
        clickedIndex: 0,
        metadata: {
          extractedAt: Date.now(),
          sourceType: 'extractor',
          strategy: `${this.name}-failed`,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        tweetInfo: tweetInfo ?? null,
      };
    }
  }
}
