/**
 * @fileoverview 미디어 추출기
 * @description API 우선 + DOM 백업 2단계 전략을 사용하는 통합 추출기
 * @version 3.0.0 - Core 서비스로 이동 - Clean Architecture
 */

import { logger } from '@shared/logging/logger';
import type { MediaExtractor, MediaExtractionOptions } from '@shared/types/media.types';
import type { MediaExtractionResult } from '@shared/types/media.types';
import { ExtractionError, ExtractionErrorCode } from '@shared/types/media.types';
import { TweetInfoExtractor } from './extractors/TweetInfoExtractor';
import { TwitterAPIExtractor } from './extractors/TwitterAPIExtractor';
import { DOMDirectExtractor } from './extractors/DOMDirectExtractor';
import { MediaExtractionCache } from './MediaExtractionCache';

/**
 * 미디어 추출기
 * API 우선 + DOM 백업 2단계 전략 사용
 */
export class MediaExtractionService implements MediaExtractor {
  private readonly tweetInfoExtractor: TweetInfoExtractor;
  private readonly apiExtractor: TwitterAPIExtractor;
  private readonly domExtractor: DOMDirectExtractor;
  private readonly cache: MediaExtractionCache;
  private readonly MAX_RETRIES = 1; // Phase 11: 단일 재시도

  constructor(cache?: MediaExtractionCache) {
    this.tweetInfoExtractor = new TweetInfoExtractor();
    this.apiExtractor = new TwitterAPIExtractor();
    this.domExtractor = new DOMDirectExtractor();
    this.cache = cache ?? new MediaExtractionCache();
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
    const logMetrics = (
      stage: string,
      data: {
        tweetId?: string | null;
        attempts?: number;
        retries?: number;
        cacheHit?: boolean;
        sourceType?: string;
        mediaCount?: number;
        staleEvicted?: boolean;
      }
    ): void => {
      try {
        logger.info(`[MediaExtractor] ${extractionId}: metrics(${stage})`, {
          metrics: {
            tweetId: data.tweetId ?? null,
            attempts: data.attempts ?? 0,
            retries: data.retries ?? 0,
            cacheHit: data.cacheHit ?? false,
            sourceType: data.sourceType ?? 'unknown',
            mediaCount: data.mediaCount ?? 0,
            staleEvicted: data.staleEvicted ?? false,
          },
        });
      } catch {
        // 메트릭스 로깅 실패는 추출에 영향 주지 않음
      }
    };

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
              attempts: 1,
              retries: 0,
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
            cacheHit: false,
            attempts: 1,
            retries: 0,
          },
          tweetInfo: domResult.tweetInfo,
        };
      }

      logger.debug(`[MediaExtractor] ${extractionId}: 트윗 정보 확보 - ${tweetInfo.tweetId}`);

      // 캐시 조회 (상태 포함)
      type CacheWithStatus = typeof this.cache & {
        getStatus?: (key: string) => {
          hit: boolean;
          expired: boolean;
          value?: MediaExtractionResult;
        };
      };
      const cacheWithStatus = this.cache as CacheWithStatus;
      const cacheStatus = cacheWithStatus.getStatus
        ? cacheWithStatus.getStatus(tweetInfo.tweetId)
        : { hit: false, expired: false };

      if (cacheStatus.expired) {
        // stale eviction 관측 메트릭
        logMetrics('cache-stale-evict', {
          tweetId: tweetInfo.tweetId,
          attempts: 0,
          retries: 0,
          cacheHit: false,
          sourceType: 'cache-stale',
          mediaCount: 0,
          staleEvicted: true,
        });
      }

      if (cacheStatus.hit && cacheStatus.value) {
        const cached = cacheStatus.value;
        logger.info(
          `[MediaExtractor] ${extractionId}: ✅ 캐시 히트 (tweetId=${tweetInfo.tweetId}) - ${cached.mediaItems.length}개`
        );
        logMetrics('cache-hit', {
          tweetId: tweetInfo.tweetId,
          attempts: (cached.metadata?.attempts as number | undefined) ?? 0,
          retries: (cached.metadata?.retries as number | undefined) ?? 0,
          cacheHit: true,
          sourceType: 'cache',
          mediaCount: cached.mediaItems.length,
        });
        return {
          ...cached,
          metadata: {
            ...(cached.metadata || {}),
            cacheHit: true,
            attempts: (cached.metadata?.attempts as number | undefined) ?? 0,
            retries: (cached.metadata?.retries as number | undefined) ?? 0,
            extractedAt: cached.metadata?.extractedAt ?? Date.now(),
            sourceType: (cached.metadata?.sourceType as string | undefined) ?? 'cache',
            strategy: 'media-extraction',
          },
        };
      }

      // 2단계: API 우선 추출
      let attempts = 0;
      let retries = 0;
      const apiResult = await this.apiExtractor.extract(tweetInfo, element, options, extractionId);
      attempts += 1;

      let primaryResult = apiResult;

      if (!(apiResult.success && apiResult.mediaItems.length > 0)) {
        // 재시도 (단 1회)
        const shouldRetry = this.MAX_RETRIES > 0;
        if (shouldRetry) {
          retries += 1;
          logger.warn(
            `[MediaExtractor] ${extractionId}: API 추출 실패 → 재시도 1회 수행 (tweetId=${tweetInfo.tweetId})`
          );
          const retryResult = await this.apiExtractor.extract(
            tweetInfo,
            element,
            options,
            `${extractionId}_retry`
          );
          attempts += 1;
          if (retryResult.success && retryResult.mediaItems.length > 0) {
            primaryResult = retryResult;
          }
        }
      }

      if (primaryResult.success && primaryResult.mediaItems.length > 0) {
        logger.info(
          `[MediaExtractor] ${extractionId}: ✅ API 추출 성공 - ${primaryResult.mediaItems.length}개 미디어 (attempts=${attempts}, retries=${retries})`
        );
        logMetrics('api-success', {
          tweetId: tweetInfo.tweetId,
          attempts,
          retries,
          cacheHit: false,
          sourceType: 'api-first',
          mediaCount: primaryResult.mediaItems.length,
        });
        const successResult = {
          success: primaryResult.success,
          mediaItems: primaryResult.mediaItems,
          clickedIndex: primaryResult.clickedIndex,
          metadata: {
            extractedAt: Date.now(),
            sourceType: 'api-first',
            strategy: 'media-extraction',
            attempts,
            retries,
            cacheHit: false,
          },
          tweetInfo: primaryResult.tweetInfo,
        } as const;
        this.cache.set(tweetInfo.tweetId, successResult);
        return successResult;
      }

      // 3단계: DOM 백업 추출
      logger.warn(
        `[MediaExtractor] ${extractionId}: API 추출 실패 (attempts=${attempts}, retries=${retries}) - DOM 백업 전략 실행`
      );
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
            cacheHit: false,
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
      const fallbackResult = {
        success: domResult.success,
        mediaItems: domResult.mediaItems,
        clickedIndex: domResult.clickedIndex,
        metadata: {
          extractedAt: Date.now(),
          sourceType: 'dom-fallback',
          strategy: 'extraction',
          attempts,
          retries,
          cacheHit: false,
        },
        tweetInfo: domResult.tweetInfo,
      } as const;
      logMetrics('dom-fallback', {
        tweetId: tweetInfo.tweetId,
        attempts,
        retries,
        cacheHit: false,
        sourceType: 'dom-fallback',
        mediaCount: domResult.mediaItems.length,
      });
      if (tweetInfo?.tweetId && domResult.success && domResult.mediaItems.length > 0) {
        this.cache.set(tweetInfo.tweetId, fallbackResult);
      }
      return fallbackResult;
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
