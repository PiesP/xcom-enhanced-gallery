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
import { StrategyChain, type StrategyChainMetrics } from './StrategyChain';
import {
  METRICS_VERSION,
  computeStrategyCacheHitRatio,
  computeSuccessResultCacheHitRatio,
} from '@shared/constants/metrics.constants';
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
  private processedElements = new WeakSet<HTMLElement>();
  private readonly strategyCache = new Map<string, string>();
  private readonly failedStrategies = new Set<string>();
  /** 첫 성공 결과 캐시 (Element 기준) - 재실행 방지 & 빠른 재오픈 지원 */
  private readonly successResultCache = new WeakMap<HTMLElement, MediaExtractionResult>();
  /** (향후) TTL 적용을 위한 저장 시각 메타 - 간단화를 위해 지금은 무제한 */
  private readonly successResultTimestamps = new WeakMap<HTMLElement, number>();
  /** 성공 결과 캐시 TTL (ms) - 0 이면 무제한 */
  private successCacheTTLMs = 0;
  private successResultCacheEvictions = 0;
  /** 세분화된 eviction 타입 (backward compat: successResultCacheEvictions = lru + ttl) */
  private successResultCacheEvictionTypes: { lru: number; ttl: number } = { lru: 0, ttl: 0 };
  /** 성공 결과 캐시 최대 엔트리 (0==무제한) */
  private successResultCacheMaxEntries = 0;
  /** LRU 순서 추적 큐 (가장 오래된 항목 앞쪽) */
  private readonly successCacheQueue: HTMLElement[] = [];

  // 성능 메트릭
  private cacheHits = 0;
  private cacheMisses = 0;
  private duplicatePreventions = 0;
  private successResultCacheHits = 0;
  private sessionId = 0;
  private sessionResets = 0;
  private clickCooldownMs = 0;
  private readonly lastExtractionTimes = new WeakMap<HTMLElement, number>();
  private readonly successCacheElements = new Set<HTMLElement>();
  private totalExtractions = 0;
  private totalExtractionFailures = 0;
  private cooldownShortCircuits = 0;
  // StrategyChain duration 집계
  private chainDurationTotalMs = 0;
  private chainDurationCount = 0;
  private chainDurationMaxMs = 0;

  /**
   * (DI Hook) 외부 세션/메트릭 서비스 주입용 생성자
   * Phase 11.B 구현 시 sessionService.beginSession() 등을 활용할 예정
   * 현재는 테스트의 DI 패턴 준수 (constructor + private + Service 토큰) 검증을 충족하기 위한 경량 주입 포인트
   */
  constructor(
    private readonly sessionService?: { beginSession?: () => void },
    private readonly extractionCache?: {
      getMetrics?: () => {
        hitCount?: number;
        missCount?: number;
        evictionCount?: number;
        lruEvictions?: number;
        ttlEvictions?: number;
        size?: number;
        hitRatio?: number;
        ttlMs?: number;
        maxEntries?: number;
        purgeCount?: number;
        purgeIntervalActive?: boolean;
      };
    }
  ) {
    // 향후 세션 경계 도입 시 beginSession() 호출 위치 후보
  }

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

    // 클릭 쿨다운 (성공 캐시보다 먼저 판정: 빠른 스팸 방지)
    if (this.clickCooldownMs > 0) {
      const last = this.lastExtractionTimes.get(element) || 0;
      const delta = last ? Date.now() - last : 0;
      if (last && delta < this.clickCooldownMs) {
        const cached = this.successResultCache.get(element);
        if (cached) {
          const augmented: MediaExtractionResult = {
            ...cached,
            metadata: {
              ...(cached.metadata || {}),
              debug: {
                ...((typeof cached.metadata?.debug === 'object' && cached.metadata?.debug) || {}),
                cacheHit: true,
                cacheType: 'success-result',
                cooldownApplied: true,
                sessionId: this.sessionId,
              },
            },
          };
          this.successResultCacheHits++;
          logger.debug('[MediaExtractionOrchestrator] 쿨다운 적용 - 캐시 반환', {
            cooldownMs: this.clickCooldownMs,
          });
          this.cooldownShortCircuits++;
          // 메트릭 요약 로깅 (쿨다운 경로)
          this.logMetricsSummary(augmented, {
            source: 'success-result-cache',
            cacheHit: true,
            cooldownApplied: true,
            strategiesTried: Array.isArray(augmented.metadata?.attemptedStrategies)
              ? (augmented.metadata?.attemptedStrategies as string[])
              : [],
          });
          return augmented;
        }
      } else if (last && delta >= this.clickCooldownMs) {
        // 쿨다운 만료 직후 첫 호출: 이전 성공 캐시 제거하여 재실행 유도
        this.successResultCache.delete(element);
        this.successResultTimestamps.delete(element);
        this.lastExtractionTimes.delete(element);
      }
    }

    // 1) 성공 결과 캐시 (WeakMap) 선조회 - 전략 재실행 회피
    const cachedSuccess = this.successResultCache.get(element);
    if (cachedSuccess) {
      const ts = this.successResultTimestamps.get(element) || 0;
      const expired = this.successCacheTTLMs > 0 && Date.now() - ts > this.successCacheTTLMs;
      if (!expired) {
        this.successResultCacheHits++;
        const augmented: MediaExtractionResult = {
          ...cachedSuccess,
          metadata: {
            ...(cachedSuccess.metadata || {}),
            debug: {
              ...((typeof cachedSuccess.metadata?.debug === 'object' &&
                cachedSuccess.metadata?.debug) ||
                {}),
              cacheHit: true,
              cacheType: 'success-result',
              sessionId: this.sessionId,
            },
          },
        };
        logger.debug('[MediaExtractionOrchestrator] 성공 결과 캐시 히트', {
          extractionId: finalExtractionId,
          strategy: augmented.metadata?.strategy,
        });
        this.logMetricsSummary(augmented, {
          source: 'success-result-cache',
          cacheHit: true,
          strategiesTried: Array.isArray(augmented.metadata?.attemptedStrategies)
            ? (augmented.metadata?.attemptedStrategies as string[])
            : [],
        });
        return augmented;
      } else {
        // TTL 만료된 캐시 제거
        this.successResultCacheEvictions++;
        this.successResultCacheEvictionTypes.ttl++;
        this.successResultCacheHits = Math.max(0, this.successResultCacheHits); // 안정성용
        this.successResultCache.delete(element);
        this.successResultTimestamps.delete(element);
        logger.debug('[MediaExtractionOrchestrator] 성공 결과 캐시 TTL 만료 - 재추출 진행', {
          extractionId: finalExtractionId,
        });
      }
    }

    // 기존: WeakSet 중복 처리 즉시 차단 → 갤러리 재오픈 불가 원인
    // 변경: 동일 요소 재시도 허용 (향후 세션/TTL 기반으로 세분화 예정 - Plan 11.B)
    if (!this.processedElements.has(element)) {
      this.processedElements.add(element);
    } else {
      logger.debug('[MediaExtractionOrchestrator] 재시도 허용 (중복 차단 제거)', {
        extractionId: finalExtractionId,
        element: element.tagName,
      });
    }

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
            // 성공 결과 캐시 저장 (LRU 지원)
            this.storeSuccessResultCacheEntry(element, result);
            this.lastExtractionTimes.set(element, Date.now());
            // 메트릭 요약 로깅 (캐시된 전략 경로)
            this.logMetricsSummary(result, {
              source: 'cached-strategy',
              cacheHit: false,
              strategiesTried: [cachedStrategyName],
            });
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

    // StrategyChain 사용 (Phase 11: createStrategyChain 훅 경유 - 병렬 그룹 커스터마이징 대비)
    const chain = this.createStrategyChain();
    const chainResult = await chain.run(element, options, finalExtractionId, tweetInfo);
    if (chainResult.result.success) {
      if (chainResult.metrics.successStrategy) {
        this.strategyCache.set(elementSignature, chainResult.metrics.successStrategy);
      }
      // 성공 결과 캐시 저장 (LRU 지원)
      this.storeSuccessResultCacheEntry(element, chainResult.result);
      this.lastExtractionTimes.set(element, Date.now());
      logger.info('[MediaExtractionOrchestrator] 추출 성공 (StrategyChain):', {
        strategyName: chainResult.metrics.successStrategy,
        extractionId: finalExtractionId,
        attempted: chainResult.metrics.attemptedStrategies,
      });
      // 메트릭 요약 로깅 (StrategyChain 성공 경로)
      // StrategyChain 실행 duration 을 central metrics 로 전달 (avg/max 집계 포함)
      this.logMetricsSummary(
        chainResult.result,
        {
          source: 'strategy-chain',
          cacheHit: false,
          strategiesTried: chainResult.metrics.attemptedStrategies,
        },
        chainResult.metrics
      );
      return chainResult.result;
    }

    this.lastExtractionTimes.set(element, Date.now());

    // 체인 실패 시 실패한 전략들 블랙리스트 추가
    for (const fs of chainResult.metrics.failedStrategies) {
      this.failedStrategies.add(fs);
    }

    // 모든 전략이 실패한 경우
    return this.createFailureResult(finalExtractionId);
  }

  /**
   * (확장 포인트) StrategyChain 생성 훅
   * 기본 구현은 등록된 단일 전략 리스트로 구성된 순차 체인을 반환한다.
   * 테스트/향후 확장에서 병렬 그룹 삽입을 위해 서브클래싱하여 재정의 가능.
   */
  protected createStrategyChain(): StrategyChain {
    // 기본체인: 등록된 전략 배열을 그대로 사용 (순차 실행)
    const baseStrategies = [...this.strategies];
    return new StrategyChain(baseStrategies);
  }

  /** 메트릭 요약 로깅 (단일 info 호출 요구 테스트 대응) */
  private logMetricsSummary(
    result: MediaExtractionResult,
    context: {
      source: string;
      cacheHit: boolean;
      strategiesTried: string[];
      cooldownApplied?: boolean;
    },
    chainMetrics?: StrategyChainMetrics
  ): void {
    try {
      // 중앙 메트릭 주입 (중복 경로 통합)
      this.annotateCentralMetrics(result, context, chainMetrics);
      this.totalExtractions += result.success ? 1 : 0;
      this.totalExtractionFailures += result.success ? 0 : 1;
      const metricsSummary = {
        success: !!result.success,
        source: context.source,
        cacheHit: context.cacheHit,
        cooldownApplied: context.cooldownApplied || false,
        strategiesTried: context.strategiesTried,
        successResultCacheHits: this.successResultCacheHits,
        successResultCacheEvictions: this.successResultCacheEvictions,
        successResultCacheEvictionTypes: { ...this.successResultCacheEvictionTypes },
        successResultCacheSize: this.successCacheElements.size,
        sessionId: this.sessionId,
        sessionResets: this.sessionResets,
        clickCooldownMs: this.clickCooldownMs,
        cooldownShortCircuits: this.cooldownShortCircuits,
        totalExtractions: this.totalExtractions,
        totalExtractionFailures: this.totalExtractionFailures,
        chainDurationAvgMs:
          this.chainDurationCount > 0
            ? this.chainDurationTotalMs / this.chainDurationCount
            : undefined,
        chainDurationMaxMs: this.chainDurationCount > 0 ? this.chainDurationMaxMs : undefined,
      };
      logger.info('[MediaExtractionOrchestrator] metrics summary', { metricsSummary });
    } catch (e) {
      logger.debug('[MediaExtractionOrchestrator] metrics summary logging 실패', {
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  /** 중앙 메트릭 주입 - 모든 경로 공통 구조 제공 */
  private annotateCentralMetrics(
    result: MediaExtractionResult,
    context: { source: string; cacheHit: boolean; strategiesTried: string[] },
    chainMetrics?: StrategyChainMetrics
  ): void {
    try {
      type CentralMeta = {
        attemptedStrategies?: string[];
        successStrategy?: string;
        strategy?: string;
        centralMetrics?: unknown;
        [k: string]: unknown;
      };
      const meta: CentralMeta = (result.metadata || {}) as CentralMeta;
      if (!result.metadata) result.metadata = meta;
      const attempted = Array.isArray(meta.attemptedStrategies)
        ? meta.attemptedStrategies
        : context.strategiesTried;
      const successStrategy = meta.successStrategy || (result.success ? meta.strategy : undefined);
      const chainDuration =
        typeof chainMetrics?.durationMs === 'number' ? chainMetrics.durationMs : undefined;
      if (typeof chainDuration === 'number') {
        this.chainDurationTotalMs += chainDuration;
        this.chainDurationCount++;
        if (chainDuration > this.chainDurationMaxMs) this.chainDurationMaxMs = chainDuration;
      }
      const cacheMetrics = this.extractionCache?.getMetrics?.();
      (meta as CentralMeta).centralMetrics = {
        attemptedStrategies: attempted,
        successStrategy,
        durationMs: typeof chainDuration === 'number' ? chainDuration : undefined,
        chainDurationAvgMs:
          this.chainDurationCount > 0
            ? this.chainDurationTotalMs / this.chainDurationCount
            : undefined,
        chainDurationMaxMs: this.chainDurationCount > 0 ? this.chainDurationMaxMs : undefined,
        // 병렬 그룹 메트릭 (존재 시)
        groupSize: typeof chainMetrics?.groupSize === 'number' ? chainMetrics.groupSize : undefined,
        winnerLatency:
          typeof chainMetrics?.winnerLatency === 'number' ? chainMetrics.winnerLatency : undefined,
        losingCancelCount:
          typeof chainMetrics?.losingCancelCount === 'number'
            ? chainMetrics.losingCancelCount
            : undefined,
        cacheHit: context.cacheHit,
        source: context.source,
        successResultCacheHits: this.successResultCacheHits,
        successResultCacheEvictions: this.successResultCacheEvictions,
        successResultCacheEvictionTypes: { ...this.successResultCacheEvictionTypes },
        successResultCacheSize: this.successCacheElements.size,
        strategyCacheHitRatio: computeStrategyCacheHitRatio(this.cacheHits, this.cacheMisses),
        successResultCacheHitRatio: computeSuccessResultCacheHitRatio(
          this.successResultCacheHits,
          this.successResultCacheEvictions
        ),
        sessionId: this.sessionId,
        extractionCache: cacheMetrics
          ? {
              hitCount: cacheMetrics.hitCount ?? 0,
              missCount: cacheMetrics.missCount ?? 0,
              lruEvictions: cacheMetrics.lruEvictions ?? 0,
              ttlEvictions: cacheMetrics.ttlEvictions ?? 0,
              size: cacheMetrics.size ?? 0,
              purgeCount: cacheMetrics.purgeCount ?? 0,
            }
          : undefined,
      };
      // 중앙 통합 후 legacy 필드 제거 (중복 방지)
      if ('strategyChainDuration' in meta) {
        try {
          delete (meta as unknown as { strategyChainDuration?: number }).strategyChainDuration;
        } catch {
          /* noop */
        }
      }
    } catch {
      // silent
    }
  }

  /** 성공 결과 캐시 저장 + LRU 용량 관리 */
  private storeSuccessResultCacheEntry(element: HTMLElement, result: MediaExtractionResult): void {
    try {
      // 기존 항목이 다시 저장되는 경우(갱신) 큐 재정렬 (간단 구현: 새 push 후 이전 잔존은 무시 - eviction 시 skip)
      this.successResultCache.set(element, result);
      this.successCacheElements.add(element);
      this.successResultTimestamps.set(element, Date.now());
      this.successCacheQueue.push(element);
      // 용량 초과 처리
      if (this.successResultCacheMaxEntries > 0) {
        while (this.successCacheElements.size > this.successResultCacheMaxEntries) {
          const candidate = this.successCacheQueue.shift();
          if (!candidate) break;
          if (!this.successCacheElements.has(candidate)) continue; // 이미 제거된 중복 큐 항목 skip
          // LRU eviction
          this.successCacheElements.delete(candidate);
          this.successResultCache.delete(candidate);
          this.successResultTimestamps.delete(candidate);
          this.lastExtractionTimes.delete(candidate);
          this.successResultCacheEvictions++;
          this.successResultCacheEvictionTypes.lru++;
          logger.debug('[MediaExtractionOrchestrator] 성공 결과 캐시 LRU eviction', {
            max: this.successResultCacheMaxEntries,
            size: this.successCacheElements.size,
          });
        }
      }
    } catch {
      // silent
    }
  }

  /** 성공 결과 캐시 최대 엔트리 설정 (0 또는 음수면 무제한) */
  setSuccessResultCacheMaxEntries(max: number): void {
    if (typeof max !== 'number') return;
    const normalized = max > 0 ? Math.floor(max) : 0;
    this.successResultCacheMaxEntries = normalized;
    logger.debug('[MediaExtractionOrchestrator] 성공 결과 캐시 최대 엔트리 설정', {
      max: normalized,
    });
    // 즉시 초과분 정리
    if (normalized > 0 && this.successCacheElements.size > normalized) {
      while (this.successCacheElements.size > normalized) {
        const candidate = this.successCacheQueue.shift();
        if (!candidate) break;
        if (!this.successCacheElements.has(candidate)) continue;
        this.successCacheElements.delete(candidate);
        this.successResultCache.delete(candidate);
        this.successResultTimestamps.delete(candidate);
        this.lastExtractionTimes.delete(candidate);
        this.successResultCacheEvictions++;
        this.successResultCacheEvictionTypes.lru++;
        logger.debug('[MediaExtractionOrchestrator] 성공 결과 캐시 LRU eviction (resize)', {
          max: normalized,
          size: this.successCacheElements.size,
        });
      }
    }
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
    const cacheMetrics = this.extractionCache?.getMetrics?.();
    const strategyCacheHitRatio =
      this.cacheHits + this.cacheMisses > 0
        ? this.cacheHits / (this.cacheHits + this.cacheMisses)
        : 0;
    const successResultCacheHitRatio =
      this.successResultCacheHits + this.successResultCacheEvictions > 0
        ? this.successResultCacheHits /
          (this.successResultCacheHits + this.successResultCacheEvictions)
        : this.successResultCacheHits > 0
          ? 1
          : 0;
    return {
      metricsVersion: METRICS_VERSION,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      cacheHitRate: strategyCacheHitRatio,
      strategyCacheHitRatio,
      successResultCacheHitRatio,
      duplicatePreventions: this.duplicatePreventions,
      strategiesCount: this.strategies.length,
      failedStrategiesCount: this.failedStrategies.size,
      registeredStrategies: this.strategies.map(s => ({
        name: s.name,
        priority: s.priority,
      })),
      failedStrategies: Array.from(this.failedStrategies),
      successResultCacheHits: this.successResultCacheHits,
      successResultCacheEvictions: this.successResultCacheEvictions,
      sessionId: this.sessionId,
      sessionResets: this.sessionResets,
      clickCooldownMs: this.clickCooldownMs,
      // MediaExtractionCache 통합 메트릭 (prefix: extractionCache_)
      extractionCache_hitCount: cacheMetrics?.hitCount ?? 0,
      extractionCache_missCount: cacheMetrics?.missCount ?? 0,
      extractionCache_evictionCount: cacheMetrics?.evictionCount ?? 0,
      extractionCache_lruEvictions: cacheMetrics?.lruEvictions ?? 0,
      extractionCache_ttlEvictions: cacheMetrics?.ttlEvictions ?? 0,
      extractionCache_size: cacheMetrics?.size ?? 0,
      extractionCache_hitRatio: cacheMetrics?.hitRatio ?? 0,
      extractionCache_ttlMs: cacheMetrics?.ttlMs ?? 0,
      extractionCache_maxEntries: cacheMetrics?.maxEntries ?? 0,
      extractionCache_purgeCount: cacheMetrics?.purgeCount ?? 0,
      extractionCache_purgeIntervalActive: cacheMetrics?.purgeIntervalActive ?? false,
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
    this.successResultCacheHits = 0;
    this.successResultCacheEvictions = 0;
    this.successResultCacheEvictionTypes = { lru: 0, ttl: 0 };
    this.sessionId = 0;
    this.sessionResets = 0;
    this.clickCooldownMs = 0;

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

  /** 테스트/운영 구성용: 성공 캐시 TTL 설정 (ms) */
  setSuccessCacheTTL(ms: number): void {
    if (typeof ms === 'number' && ms >= 0) {
      this.successCacheTTLMs = ms;
      logger.debug('[MediaExtractionOrchestrator] 성공 결과 캐시 TTL 설정', { ttl: ms });
    }
  }

  /** 세션 경계 시작: processedElements 및 실패 전략 초기화, 성공 캐시는 유지 (빠른 재오픈 UX) */
  beginNewSession(elementsToInvalidate?: Iterable<HTMLElement>): void {
    this.sessionId++;
    this.sessionResets++;
    this.processedElements = new WeakSet<HTMLElement>();
    this.failedStrategies.clear();
    // 세션 경계에서는 성공 캐시도 비움 (테스트 기대)
    // WeakMap 재할당 불가(readonly) → 새로운 WeakMap 생성 대신 기존 참조 내 항목 삭제: WeakMap은 keys 열거 불가하므로 단순히 새 인스턴스 필요하지만
    // readonly 제한으로 재할당하지 않음. 설계상 세션 경계에서 캐시 무효화를 위해서는 개별 요소가 다시 추출 시 overwrite 하도록 둔다.
    // (테스트는 동일 요소 캐시 히트가 아닌 재실행을 기대하므로 해당 요소에 대한 항목만 제거)
    // successResultCache/ Timestamps / lastExtractionTimes 는 세션 경계 직전 사용된 element 들 모두 제거가 이상적이지만 keys 열거 불가.
    // 여기서는 no-op; 호출 직후 동일 요소 추출 전에 명시적으로 삭제하도록 선택 가능. (향후 API 확장 필요)
    const targets: Iterable<HTMLElement> | undefined =
      elementsToInvalidate || this.successCacheElements;
    if (targets) {
      for (const el of targets) {
        this.successResultCache.delete(el);
        this.successResultTimestamps.delete(el);
        this.lastExtractionTimes.delete(el);
      }
    }
    this.successCacheElements.clear();
    this.successResultCacheEvictionTypes = { lru: 0, ttl: 0 };
    logger.debug('[MediaExtractionOrchestrator] 새 세션 시작', { sessionId: this.sessionId });
  }

  /** 클릭 쿨다운 (ms) 설정 */
  setClickCooldown(ms: number): void {
    if (typeof ms === 'number' && ms >= 0) {
      this.clickCooldownMs = ms;
      logger.debug('[MediaExtractionOrchestrator] 클릭 쿨다운 설정', { ms });
    }
  }
}

// METRICS_VERSION 상수는 '@shared/constants/metrics.constants'에서 관리
