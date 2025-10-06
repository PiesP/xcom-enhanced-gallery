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
   *
   * @version 3.1.0 - Production 환경 감지 및 디버깅 강화 (Epic PRODUCTION-ENVIRONMENT-VALIDATION)
   */
  async extractFromClickedElement(
    element: HTMLElement,
    options: MediaExtractionOptions = {}
  ): Promise<MediaExtractionResult> {
    const extractionId = this.generateExtractionId();

    // Production 환경 감지
    const isProduction =
      typeof window !== 'undefined' &&
      (window.location.hostname.includes('x.com') ||
        window.location.hostname.includes('twitter.com'));

    logger.info(`[MediaExtractor] ${extractionId}: 추출 시작`, {
      environment: isProduction ? 'production' : 'test',
      elementTag: element.tagName,
      elementClasses: element.className.substring(0, 50), // 보안: 길이 제한
    });

    try {
      // 1단계: 트윗 정보 추출
      const tweetInfo = await this.tweetInfoExtractor.extract(element);

      if (!tweetInfo?.tweetId) {
        logger.debug(`[MediaExtractor] ${extractionId}: 트윗 정보 없음 - DOM 직접 추출로 진행`);
        const domResult = await this.domExtractor.extract(element, options, extractionId);

        // DOM 직접 추출 실패 시 자세한 디버그 정보 포함
        if (!domResult.success || domResult.mediaItems.length === 0) {
          // Production 환경에서 상세 DOM 스냅샷 캡처
          const domSnapshot = isProduction ? this.captureDOMStructureSnapshot(element) : null;
          const selectorTests = isProduction ? this.testAllSelectors(element) : null;

          logger.warn(`[MediaExtractor] ${extractionId}: DOM 직접 추출 실패`, {
            success: domResult.success,
            mediaCount: domResult.mediaItems.length,
            element: element.tagName,
            elementClass: element.className,
            parentElement: element.parentElement?.tagName,
            domSnapshot, // Production 환경 전용 상세 정보
            selectorTests, // Production 환경 전용 셀렉터 테스트
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
                domSnapshot, // Production 디버깅용 DOM 구조
                selectorTests, // Production 디버깅용 셀렉터 테스트
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
        // Production 환경에서 상세 DOM 스냅샷 캡처
        const domSnapshot = isProduction ? this.captureDOMStructureSnapshot(element) : null;
        const selectorTests = isProduction ? this.testAllSelectors(element) : null;

        logger.error(`[MediaExtractor] ${extractionId}: DOM 백업 추출도 실패`, {
          domSuccess: domResult.success,
          mediaCount: domResult.mediaItems.length,
          element: element.tagName,
          elementClass: element.className,
          tweetId: tweetInfo.tweetId,
          domSnapshot, // Production 환경 전용 상세 정보
          selectorTests, // Production 환경 전용 셀렉터 테스트
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
              domSnapshot, // Production 디버깅용 DOM 구조
              selectorTests, // Production 디버깅용 셀렉터 테스트
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
   * Production 환경 디버깅: DOM 구조 스냅샷 캡처
   * Epic PRODUCTION-ENVIRONMENT-VALIDATION Phase 1-3
   *
   * @param element 분석할 요소
   * @returns DOM 구조 요약 객체
   */
  private captureDOMStructureSnapshot(element: HTMLElement): object {
    return {
      tagName: element.tagName,
      classes: element.className.substring(0, 100), // 보안: 긴 값은 잘라냄
      attributes: Array.from(element.attributes)
        .map(a => ({
          name: a.name,
          value: a.value.substring(0, 50), // 보안: 긴 값은 잘라냄
        }))
        .slice(0, 10), // 최대 10개 속성만
      childrenTags: Array.from(element.children)
        .map(c => c.tagName)
        .slice(0, 20), // 최대 20개 자식만
      videoElements: element.querySelectorAll('video').length,
      imgElements: element.querySelectorAll('img').length,
      hasVideoPlayer: element.querySelector('[data-testid="videoPlayer"]') !== null,
      hasVideoComponent: element.querySelector('[data-testid="videoComponent"]') !== null,
      hasRoleButton: element.querySelector('[role="button"]') !== null,
    };
  }

  /**
   * Production 환경 디버깅: 여러 셀렉터 테스트 결과
   *
   * @param element 테스트할 요소
   * @returns 각 셀렉터별 매칭 결과
   */
  private testAllSelectors(element: HTMLElement): object {
    const selectors = [
      'video',
      '[data-testid="videoPlayer"] video',
      '[data-testid="videoComponent"] video',
      '[role="button"] video',
      'video[playsinline][loop][autoplay]',
      'img[src*="twimg.com"]',
    ];

    const results: Record<string, number> = {};
    for (const selector of selectors) {
      try {
        results[selector] = element.querySelectorAll(selector).length;
      } catch {
        results[selector] = -1; // 셀렉터 오류
      }
    }

    return results;
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
      errors: [new ExtractionError(ExtractionErrorCode.UNKNOWN_ERROR, errorMessage)],
    };
  }
}
