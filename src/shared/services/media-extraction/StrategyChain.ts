/**
 * @file StrategyChain - 순차적 전략 실행 및 메트릭 수집
 * Phase 11 HARDEN: MediaExtractionOrchestrator 내부 for-loop 리팩터링
 */
import type {
  MediaExtractionOptions,
  MediaExtractionResult,
  TweetInfo,
} from '@shared/types/media.types';
import type { ExtractionStrategy } from './MediaExtractionOrchestrator';
import { ExtractionError, ExtractionErrorCode } from '@shared/types/media.types';

export interface StrategyChainMetrics {
  attemptedStrategies: string[];
  successStrategy?: string;
  failedStrategies: string[];
  totalTried: number;
  durationMs: number;
  // DSL 확장: 커스텀 미들웨어 호출 횟수 (존재 시에만)
  customMiddlewareCalls?: { before: number; after: number };
}

export interface StrategyChainResult {
  result: MediaExtractionResult;
  metrics: StrategyChainMetrics;
}

export class StrategyChain {
  constructor(protected readonly strategies: ExtractionStrategy[]) {}
  async run(
    element: HTMLElement,
    options: MediaExtractionOptions,
    extractionId: string,
    tweetInfo?: TweetInfo
  ): Promise<StrategyChainResult> {
    const attempted: string[] = [];
    const failed: string[] = [];
    const start = performance.now ? performance.now() : Date.now();

    for (const strategy of this.strategies) {
      if (!strategy.canHandle(element, options)) {
        continue;
      }
      attempted.push(strategy.name);
      try {
        const result = await strategy.extract(element, options, extractionId, tweetInfo);
        if (result.success) {
          const durationMs = (performance.now ? performance.now() : Date.now()) - start;
          // 메타데이터 주입 (legacy strategyChainDuration 제거 - duration 은 Orchestrator centralMetrics에서만 노출)
          result.metadata = {
            ...(result.metadata || {}),
            successStrategy: strategy.name,
            attemptedStrategies: [...attempted],
          };
          return {
            result,
            metrics: {
              attemptedStrategies: [...attempted],
              successStrategy: strategy.name,
              failedStrategies: failed,
              totalTried: attempted.length,
              durationMs,
              ...(this as unknown as { _customMiddlewareCounters?: Record<string, unknown> })
                ._customMiddlewareCounters,
            },
          };
        }
        failed.push(strategy.name);
      } catch {
        failed.push(strategy.name);
      }
    }

    const durationMs = (performance.now ? performance.now() : Date.now()) - start;
    const failure: MediaExtractionResult = {
      success: false,
      mediaItems: [],
      clickedIndex: 0,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'strategy-chain-failed',
        strategy: 'strategy-chain',
        attemptedStrategies: [...attempted],
      },
      tweetInfo: tweetInfo ?? null,
      errors: [
        new ExtractionError(
          ExtractionErrorCode.NO_MEDIA_FOUND,
          '전략 체인 내 모든 전략이 실패했습니다'
        ),
      ],
    };

    return {
      result: failure,
      metrics: {
        attemptedStrategies: [...attempted],
        successStrategy: undefined,
        failedStrategies: [...failed],
        totalTried: attempted.length,
        durationMs,
        ...(this as unknown as { _customMiddlewareCounters?: Record<string, unknown> })
          ._customMiddlewareCounters,
      },
    };
  }
}

// DSL: 미들웨어 타입
export interface StrategyChainMiddlewareContext {
  element: HTMLElement;
  options: MediaExtractionOptions;
  extractionId: string;
}
export interface StrategyChainMiddleware {
  before?(ctx: StrategyChainMiddlewareContext, strategy: ExtractionStrategy): Promise<void> | void;
  after?(
    ctx: StrategyChainMiddlewareContext,
    strategy: ExtractionStrategy,
    result: MediaExtractionResult
  ): Promise<void> | void;
}

export class StrategyChainBuilder {
  private readonly strategies: ExtractionStrategy[] = [];
  private readonly middlewares: StrategyChainMiddleware[] = [];
  private readonly counters = { before: 0, after: 0 };

  add(strategy: ExtractionStrategy): this {
    this.strategies.push(strategy);
    return this;
  }

  use(mw: StrategyChainMiddleware): this {
    this.middlewares.push(mw);
    return this;
  }

  build(): StrategyChain {
    const chain = new StrategyChainProxyWrapper(
      this.strategies,
      this.middlewares,
      this.counters
    ) as unknown as StrategyChain;
    return chain;
  }
}

// 내부 프록시: StrategyChain 인터페이스를 유지하면서 run 훅 확장
class StrategyChainProxyWrapper extends StrategyChain {
  constructor(
    strategies: ExtractionStrategy[],
    private readonly mws: StrategyChainMiddleware[],
    private readonly counters: { before: number; after: number }
  ) {
    super(strategies);
  }
  override async run(
    element: HTMLElement,
    options: MediaExtractionOptions,
    extractionId: string,
    tweetInfo?: TweetInfo
  ): Promise<StrategyChainResult> {
    // StrategyChain 원본 run을 미들웨어로 감싸기 위해 커스텀 실행 루프 재구현 (중복 로직 피하려면 리팩터 필요하지만 1차 스캐폴드)
    const attempted: string[] = [];
    const failed: string[] = [];
    const start = performance.now ? performance.now() : Date.now();
    for (const strategy of this.strategies) {
      if (!strategy.canHandle(element, options)) continue;
      attempted.push(strategy.name);
      try {
        for (const mw of this.mws) {
          if (mw.before) {
            await mw.before({ element, options, extractionId }, strategy);
            this.counters.before++;
          }
        }
        const result = await strategy.extract(element, options, extractionId, tweetInfo);
        for (const mw of this.mws) {
          if (mw.after) {
            await mw.after({ element, options, extractionId }, strategy, result);
            this.counters.after++;
          }
        }
        if (result.success) {
          const durationMs = (performance.now ? performance.now() : Date.now()) - start;
          result.metadata = {
            ...(result.metadata || {}),
            successStrategy: strategy.name,
            attemptedStrategies: [...attempted],
          };
          (
            this as unknown as { _customMiddlewareCounters?: Record<string, unknown> }
          )._customMiddlewareCounters = {
            customMiddlewareCalls: { ...this.counters },
          };
          return {
            result,
            metrics: {
              attemptedStrategies: [...attempted],
              successStrategy: strategy.name,
              failedStrategies: failed,
              totalTried: attempted.length,
              durationMs,
              customMiddlewareCalls: { ...this.counters },
            },
          };
        }
        failed.push(strategy.name);
      } catch {
        failed.push(strategy.name);
      }
    }
    const durationMs = (performance.now ? performance.now() : Date.now()) - start;
    const failure: MediaExtractionResult = {
      success: false,
      mediaItems: [],
      clickedIndex: 0,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'strategy-chain-failed',
        strategy: 'strategy-chain',
        attemptedStrategies: [...attempted],
      },
      tweetInfo: tweetInfo ?? null,
      errors: [
        new ExtractionError(
          ExtractionErrorCode.NO_MEDIA_FOUND,
          '전략 체인 내 모든 전략이 실패했습니다'
        ),
      ],
    };
    (
      this as unknown as { _customMiddlewareCounters?: Record<string, unknown> }
    )._customMiddlewareCounters = {
      customMiddlewareCalls: { ...this.counters },
    };
    return {
      result: failure,
      metrics: {
        attemptedStrategies: [...attempted],
        successStrategy: undefined,
        failedStrategies: failed,
        totalTried: attempted.length,
        durationMs,
        customMiddlewareCalls: { ...this.counters },
      },
    };
  }
}
