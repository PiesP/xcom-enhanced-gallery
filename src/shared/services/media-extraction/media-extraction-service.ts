/**
 * @fileoverview 미디어 추출기
 * @description API 우선 + DOM 백업 2단계 전략을 사용하는 통합 추출기
 * @version 3.0.0 - Core 서비스로 이동 - Clean Architecture
 */

import { logger } from '@shared/logging/logger';
import type { MediaExtractor, MediaExtractionOptions } from '@shared/types/media.types';
import type { MediaExtractionResult } from '@shared/types/media.types';
import { ExtractionError, ExtractionErrorCode } from '@shared/types/media.types';
import { TweetInfoExtractor } from './extractors/tweet-info-extractor';
import { TwitterAPIExtractor } from './extractors/twitter-api-extractor';
import { DOMDirectExtractor } from './extractors/dom-direct-extractor';

/**
 * 미디어 추출기
 * API 우선 + DOM 백업 2단계 전략 사용
 */
export class MediaExtractionService implements MediaExtractor {
  private readonly tweetInfoExtractor: TweetInfoExtractor;
  private readonly apiExtractor: TwitterAPIExtractor;
  private readonly domExtractor: DOMDirectExtractor;

  constructor() {
    this.tweetInfoExtractor = new TweetInfoExtractor();
    this.apiExtractor = new TwitterAPIExtractor();
    this.domExtractor = new DOMDirectExtractor();
  }

  /**
   * 간소화된 2단계 추출
   * 1. 트윗 정보 추출
   * 2. API 우선 추출 또는 DOM 직접 추출
   */
  async extractFromClickedElement(
    element: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    const extractionId = this.generateExtractionId();
    logger.info(`[MediaExtractor] ${extractionId}: 추출 시작`);

    try {
      // 1단계: 트윗 정보 추출
      const tweetInfo = await this.tweetInfoExtractor.extract(element);

      if (!tweetInfo?.tweetId) {
        logger.debug(`[MediaExtractor] ${extractionId}: 트윗 정보 없음 - DOM 직접 추출로 진행`);
        const domResult = await this.domExtractor.extract(element, options, extractionId);

        // DOM 직접 추출 실패 시 자세한 디버그 정보 포함
        if (!domResult.success || domResult.mediaItems.length === 0) {
          logger.warn(`[MediaExtractor] ${extractionId}: DOM 직접 추출 실패`, {
            success: domResult.success,
            mediaCount: domResult.mediaItems.length,
            element: element.tagName,
            elementClass: element.className,
            parentElement: element.parentElement?.tagName,
          });

          return {
            success: false,
            mediaItems: [],
            clickedIndex: 0,
            metadata: {
              extractedAt: Date.now(),
              sourceType: 'dom-direct-failed',
              strategy: 'media-extraction',
              error: '트윗 정보 없음 및 DOM 직접 추출 실패',
              debug: {
                element: element.tagName,
                elementClass: element.className,
                parentElement: element.parentElement?.tagName,
                domResult: {
                  success: domResult.success,
                  mediaCount: domResult.mediaItems.length,
                },
              },
            },
            tweetInfo: domResult.tweetInfo,
            errors: [
              new ExtractionError(
                ExtractionErrorCode.NO_MEDIA_FOUND,
                '트윗에서 미디어를 찾을 수 없습니다.'
              ),
            ],
          };
        }

        // core 인터페이스 형식으로 변환
        return {
          success: domResult.success,
          mediaItems: domResult.mediaItems,
          clickedIndex: domResult.clickedIndex,
          metadata: {
            extractedAt: Date.now(),
            sourceType: 'dom-fallback',
            strategy: 'media-extraction',
          },
          tweetInfo: domResult.tweetInfo,
        };
      }

      logger.debug(`[MediaExtractor] ${extractionId}: 트윗 정보 확보 - ${tweetInfo.tweetId}`);

      // 2단계: API 우선 추출
      const apiResult = await this.apiExtractor.extract(tweetInfo, element, options, extractionId);

      if (apiResult.success && apiResult.mediaItems.length > 0) {
        logger.info(
          `[MediaExtractor] ${extractionId}: ✅ API 추출 성공 - ${apiResult.mediaItems.length}개 미디어`
        );
        // core 인터페이스 형식으로 변환
        return {
          success: apiResult.success,
          mediaItems: apiResult.mediaItems,
          clickedIndex: apiResult.clickedIndex,
          metadata: {
            extractedAt: Date.now(),
            sourceType: 'api-first',
            strategy: 'media-extraction',
          },
          tweetInfo: apiResult.tweetInfo,
        };
      }

      // 3단계: DOM 백업 추출
      logger.warn(`[MediaExtractor] ${extractionId}: API 추출 실패 - DOM 백업 전략 실행`);
      const domResult = await this.domExtractor.extract(element, options, extractionId, tweetInfo);

      // DOM 추출도 실패한 경우 자세한 오류 정보 포함
      if (!domResult.success || domResult.mediaItems.length === 0) {
        logger.error(`[MediaExtractor] ${extractionId}: DOM 백업 추출도 실패`, {
          domSuccess: domResult.success,
          mediaCount: domResult.mediaItems.length,
          element: element.tagName,
          elementClass: element.className,
          tweetId: tweetInfo.tweetId,
        });

        return {
          success: false,
          mediaItems: [],
          clickedIndex: 0,
          metadata: {
            extractedAt: Date.now(),
            sourceType: 'extraction-failed',
            strategy: 'media-extraction',
            error: `미디어 추출 실패: API 및 DOM 추출 모두 실패`,
            debug: {
              element: element.tagName,
              elementClass: element.className,
              tweetId: tweetInfo.tweetId,
              domResult: {
                success: domResult.success,
                mediaCount: domResult.mediaItems.length,
              },
            },
          },
          tweetInfo: domResult.tweetInfo,
          errors: [
            new ExtractionError(
              ExtractionErrorCode.NO_MEDIA_FOUND,
              'API 및 DOM 추출 모두 실패하였습니다.'
            ),
          ],
        };
      }

      // core 인터페이스 형식으로 변환
      return {
        success: domResult.success,
        mediaItems: domResult.mediaItems,
        clickedIndex: domResult.clickedIndex,
        metadata: {
          extractedAt: Date.now(),
          sourceType: 'dom-fallback',
          strategy: 'extraction',
        },
        tweetInfo: domResult.tweetInfo,
      };
    } catch (error) {
      logger.error(`[MediaExtractor] ${extractionId}: 추출 실패:`, error);
      return this.createErrorResult(error);
    }
  }

  /**
   * 컨테이너에서 모든 미디어 추출
   * 컨테이너 내 첫 번째 미디어 요소를 찾아 추출
   */
  async extractAllFromContainer(
    container: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    const extractionId = this.generateExtractionId();
    logger.debug(`[MediaExtractor] ${extractionId}: 컨테이너 추출 시작`);

    try {
      // 컨테이너 내 첫 번째 미디어 요소 찾기
      const firstMedia = container.querySelector(
        'img[src*="pbs.twimg.com"], video[src*="video.twimg.com"]'
      ) as HTMLElement;

      if (!firstMedia) {
        logger.warn(`[MediaExtractor] ${extractionId}: 컨테이너에서 미디어를 찾을 수 없음`);
        return this.createErrorResult('컨테이너에서 미디어를 찾을 수 없음');
      }

      return this.extractFromClickedElement(firstMedia, options);
    } catch (error) {
      logger.error(`[MediaExtractor] ${extractionId}: 컨테이너 추출 실패:`, error);
      return this.createErrorResult(error);
    }
  }

  /**
   * 추출 ID 생성 - crypto.randomUUID() 우선 사용
   */
  private generateExtractionId(): string {
    try {
      // crypto.randomUUID() 사용 (Node.js 16+, 모던 브라우저)
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `simp_${crypto.randomUUID()}`;
      }
    } catch {
      // crypto.randomUUID() 실패 시 폴백
    }

    // 폴백: 강화된 랜덤 생성
    const timestamp = Date.now();
    const random1 = Math.random().toString(36).substring(2, 9);
    const random2 = Math.random().toString(36).substring(2, 9);

    return `simp_${timestamp}_${random1}_${random2}`;
  }

  /**
   * 오류 결과 생성
   */
  private createErrorResult(error: unknown): MediaExtractionResult {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('MediaExtractionService: 추출 중 오류 발생', {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
    });

    return {
      success: false,
      mediaItems: [],
      clickedIndex: 0,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'error',
        strategy: 'media-extraction',
        error: errorMessage,
        debug: {
          originalError: error,
          stack: errorStack,
        },
      },
      tweetInfo: null,
      errors: [
        new ExtractionError(
          ExtractionErrorCode.UNKNOWN_ERROR,
          `미디어 추출 중 오류가 발생했습니다: ${errorMessage}`,
          error instanceof Error ? error : undefined
        ),
      ],
    };
  }
}
