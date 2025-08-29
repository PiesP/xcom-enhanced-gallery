/**
 * @fileoverview MediaExtractionOrchestrator - 통합 미디어 추출 시스템
 * @description Phase 7: 모든 폴백 전략을 단일 오케스트레이터로 관리
 */

import type {
  MediaExtractionOptions,
  MediaExtractionResult,
  TweetInfo,
} from '@shared/types/media.types';
import { logger } from '@shared/logging/logger';
import { ExtractionError, ExtractionErrorCode } from '@shared/types/media.types';

/**
 * 미디어 추출 전략 인터페이스
 */
export interface ExtractionStrategy {
  readonly name: string;
  readonly priority: number;
  canHandle(element: HTMLElement, options: MediaExtractionOptions): boolean;
  extract(
    element: HTMLElement,
    options: MediaExtractionOptions,
    extractionId: string,
    tweetInfo?: TweetInfo
  ): Promise<MediaExtractionResult>;
}

/**
 * 요소 시그니처 생성기
 */
class ElementSignatureGenerator {
  /**
   * 요소의 고유 시그니처 생성
   */
  static generate(element: HTMLElement): string {
    const tagName = element.tagName.toLowerCase();
    const className = element.className || '';
    const src = element.getAttribute('src') || '';
    const href = element.getAttribute('href') || '';

    // 시그니처 생성 (tagName + 주요 속성들의 해시)
    const signature = `${tagName}-${className.slice(0, 20)}-${src.slice(-20)}-${href.slice(-20)}`;
    return signature.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 50);
  }
}

/**
 * 통합 미디어 추출 오케스트레이터
 *
 * 기능:
 * - 통합 폴백 체인 관리
 * - 중복 실행 방지
 * - 전략 캐싱 및 성능 최적화
 * - 실패 전략 블랙리스트 관리
 */
export class MediaExtractionOrchestrator {
  private readonly strategies: ExtractionStrategy[] = [];
  private readonly processedElements = new WeakSet<HTMLElement>();
  private readonly strategyCache = new Map<string, string>();
  private readonly failedStrategies = new Set<string>();

  // 성능 메트릭
  private cacheHits = 0;
  private cacheMisses = 0;
  private duplicatePreventions = 0;

  /**
   * 추출 전략 등록
   */
  addStrategy(strategy: ExtractionStrategy): void {
    this.strategies.push(strategy);
    // 우선순위 순으로 정렬 (낮은 숫자 = 높은 우선순위)
    this.strategies.sort((a, b) => a.priority - b.priority);

    logger.debug('[MediaExtractionOrchestrator] 전략 등록:', {
      name: strategy.name,
      priority: strategy.priority,
      totalStrategies: this.strategies.length,
    });
  }

  /**
   * 추출 전략 제거
   */
  removeStrategy(strategyName: string): boolean {
    const index = this.strategies.findIndex(s => s.name === strategyName);
    if (index !== -1) {
      this.strategies.splice(index, 1);
      this.failedStrategies.delete(strategyName);

      logger.debug('[MediaExtractionOrchestrator] 전략 제거:', {
        name: strategyName,
        totalStrategies: this.strategies.length,
      });

      return true;
    }
    return false;
  }

  /**
   * 메인 추출 메서드
   */
  async extract(
    element: HTMLElement,
    options: MediaExtractionOptions = {},
    extractionId?: string,
    tweetInfo?: TweetInfo
  ): Promise<MediaExtractionResult> {
    const finalExtractionId = extractionId || this.generateExtractionId();

    // 중복 처리 방지
    if (this.processedElements.has(element)) {
      this.duplicatePreventions++;
      logger.debug('[MediaExtractionOrchestrator] 중복 처리 방지:', {
        extractionId: finalExtractionId,
        element: element.tagName,
      });

      return this.createDuplicateResult(finalExtractionId);
    }

    this.processedElements.add(element);

    // 캐시된 전략 확인
    const elementSignature = ElementSignatureGenerator.generate(element);
    const cachedStrategyName = this.strategyCache.get(elementSignature);

    if (cachedStrategyName && !this.failedStrategies.has(cachedStrategyName)) {
      const cachedStrategy = this.strategies.find(s => s.name === cachedStrategyName);
      if (cachedStrategy?.canHandle(element, options)) {
        this.cacheHits++;

        logger.debug('[MediaExtractionOrchestrator] 캐시된 전략 사용:', {
          strategyName: cachedStrategyName,
          extractionId: finalExtractionId,
        });

        try {
          const result = await cachedStrategy.extract(
            element,
            options,
            finalExtractionId,
            tweetInfo
          );
          if (result.success) {
            return result;
          }
          // 캐시된 전략이 실패하면 실패 목록에 추가
          this.failedStrategies.add(cachedStrategyName);
        } catch (error) {
          logger.warn('[MediaExtractionOrchestrator] 캐시된 전략 실행 실패:', {
            strategyName: cachedStrategyName,
            error: error instanceof Error ? error.message : String(error),
          });
          this.failedStrategies.add(cachedStrategyName);
        }
      }
    } else {
      this.cacheMisses++;
    }

    // 폴백 체인 실행
    for (const strategy of this.strategies) {
      // 실패한 전략 건너뛰기
      if (this.failedStrategies.has(strategy.name)) {
        continue;
      }

      // 전략이 요소를 처리할 수 있는지 확인
      if (!strategy.canHandle(element, options)) {
        continue;
      }

      logger.debug('[MediaExtractionOrchestrator] 전략 시도:', {
        strategyName: strategy.name,
        priority: strategy.priority,
        extractionId: finalExtractionId,
      });

      try {
        const result = await strategy.extract(element, options, finalExtractionId, tweetInfo);

        if (result.success) {
          // 성공한 전략을 캐시에 저장
          this.strategyCache.set(elementSignature, strategy.name);

          logger.info('[MediaExtractionOrchestrator] 추출 성공:', {
            strategyName: strategy.name,
            extractionId: finalExtractionId,
            mediaCount: result.mediaItems.length,
          });

          return result;
        }
      } catch (error) {
        logger.error('[MediaExtractionOrchestrator] 전략 실행 오류:', {
          strategyName: strategy.name,
          extractionId: finalExtractionId,
          error: error instanceof Error ? error.message : String(error),
        });

        // 실패한 전략을 블랙리스트에 추가
        this.failedStrategies.add(strategy.name);
      }
    }

    // 모든 전략이 실패한 경우
    return this.createFailureResult(finalExtractionId);
  }

  /**
   * 추출 ID 생성
   */
  private generateExtractionId(): string {
    try {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `orch_${crypto.randomUUID()}`;
      }
    } catch {
      // crypto.randomUUID() 실패 시 폴백
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `orch_${timestamp}_${random}`;
  }

  /**
   * 중복 처리 결과 생성
   */
  private createDuplicateResult(_extractionId: string): MediaExtractionResult {
    return {
      success: false,
      mediaItems: [],
      clickedIndex: 0,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'duplicate',
        strategy: 'orchestrator',
        debug: {
          reason: 'duplicate_processing_prevented',
        },
      },
      tweetInfo: null,
      errors: [
        new ExtractionError(ExtractionErrorCode.DUPLICATE_PROCESSING, '이미 처리된 요소입니다'),
      ],
    };
  }

  /**
   * 실패 결과 생성
   */
  private createFailureResult(_extractionId: string): MediaExtractionResult {
    return {
      success: false,
      mediaItems: [],
      clickedIndex: 0,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'fallback_exhausted',
        strategy: 'orchestrator',
        debug: {
          availableStrategies: this.strategies.map(s => s.name),
          failedStrategies: Array.from(this.failedStrategies),
        },
      },
      tweetInfo: null,
      errors: [
        new ExtractionError(ExtractionErrorCode.NO_MEDIA_FOUND, '모든 추출 전략이 실패했습니다'),
      ],
    };
  }

  /**
   * 성능 메트릭 조회
   */
  getMetrics() {
    return {
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      cacheHitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0,
      duplicatePreventions: this.duplicatePreventions,
      strategiesCount: this.strategies.length,
      failedStrategiesCount: this.failedStrategies.size,
      registeredStrategies: this.strategies.map(s => ({
        name: s.name,
        priority: s.priority,
      })),
      failedStrategies: Array.from(this.failedStrategies),
    };
  }

  /**
   * 캐시 및 실패 목록 초기화
   */
  clearCache(): void {
    this.strategyCache.clear();
    this.failedStrategies.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.duplicatePreventions = 0;

    logger.debug('[MediaExtractionOrchestrator] 캐시 및 메트릭 초기화 완료');
  }

  /**
   * 특정 전략의 실패 상태 해제
   */
  resetStrategy(strategyName: string): void {
    this.failedStrategies.delete(strategyName);

    logger.debug('[MediaExtractionOrchestrator] 전략 상태 초기화:', {
      strategyName,
    });
  }
}
