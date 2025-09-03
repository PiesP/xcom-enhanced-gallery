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
  // DSL 확장 v2: duplicate guard / retry decorator (존재 시에만)
  duplicateSkipped?: number;
  strategyRetries?: Record<string, number>;
  // v3: 병렬 그룹 메트릭 (병렬 그룹에서 성공했을 경우에만 노출)
  groupSize?: number;
  winnerLatency?: number; // 병렬 그룹 시작 -> 성공 전략 resolve 까지 경과 ms
  losingCancelCount?: number; // 성공 시점에 아직 완료되지 않은 나머지 전략 수
}

export interface StrategyChainResult {
  result: MediaExtractionResult;
  metrics: StrategyChainMetrics;
}

// 내부 실행 엔트리: 단일 전략 또는 병렬 그룹(배열)
type StrategyEntry = ExtractionStrategy | ExtractionStrategy[];

export class StrategyChain {
  constructor(protected readonly strategies: StrategyEntry[]) {}
  // 기본 구현 (프록시 확장에서 재정의). Base run 에서 병렬 그룹 메트릭을 사용하기 위해 선언만.
  // Proxy wrapper 에 실제 구현이 있으므로 여기서는 throw 또는 간단 fallback.

  protected async executeParallelGroup(
    strategies: ExtractionStrategy[],
    element: HTMLElement,
    options: MediaExtractionOptions,
    extractionId: string,
    tweetInfo?: TweetInfo
  ): Promise<{
    successResult?: MediaExtractionResult;
    successName?: string;
    failures: string[];
    groupMeta: { groupSize: number };
  }> {
    // 기본 체인은 병렬을 지원하지 않는 경우: 순차 실행 흉내 (첫 성공 시 종료)
    const failures: string[] = [];
    for (const s of strategies) {
      try {
        const r = await s.extract(element, options, extractionId, tweetInfo);
        if (r.success) {
          return {
            successResult: r,
            successName: s.name,
            failures,
            groupMeta: { groupSize: strategies.length },
          };
        }
        failures.push(s.name);
      } catch {
        failures.push(s.name);
      }
    }
    return { failures, groupMeta: { groupSize: strategies.length } };
  }
  async run(
    element: HTMLElement,
    options: MediaExtractionOptions,
    extractionId: string,
    tweetInfo?: TweetInfo
  ): Promise<StrategyChainResult> {
    const attempted: string[] = [];
    const failed: string[] = [];
    const start = performance.now ? performance.now() : Date.now();

    for (const entry of this.strategies) {
      // 병렬 그룹 처리
      if (Array.isArray(entry)) {
        const group = entry.filter(s => s.canHandle(element, options));
        if (group.length === 0) continue;
        // 병렬 그룹 시도 목록에 먼저 모두 추가
        for (const s of group) attempted.push(s.name);
        const parallelStart = performance.now ? performance.now() : Date.now();
        const { successResult, successName, failures, groupMeta } = await this.executeParallelGroup(
          group,
          element,
          options,
          extractionId,
          tweetInfo
        );
        if (successResult) {
          const durationMs = (performance.now ? performance.now() : Date.now()) - start;
          successResult.metadata = {
            ...(successResult.metadata || {}),
            successStrategy: successName,
            attemptedStrategies: [...attempted],
          };
          const winnerLatency = (performance.now ? performance.now() : Date.now()) - parallelStart;
          return {
            result: successResult,
            metrics: {
              attemptedStrategies: [...attempted],
              successStrategy: successName,
              failedStrategies: failed,
              totalTried: attempted.length,
              durationMs,
              groupSize: groupMeta?.groupSize,
              winnerLatency,
              losingCancelCount: groupMeta ? groupMeta.groupSize - 1 - failures.length : undefined,
              ...(this as unknown as { _customMiddlewareCounters?: Record<string, unknown> })
                ._customMiddlewareCounters,
            },
          };
        }
        // 전부 실패한 경우 실패 목록 추가 후 다음 엔트리 진행
        for (const f of failures) failed.push(f);
        continue;
      }
      const strategy = entry;
      if (!strategy.canHandle(element, options)) continue;
      attempted.push(strategy.name);
      try {
        const result = await strategy.extract(element, options, extractionId, tweetInfo);
        if (result.success) {
          const durationMs = (performance.now ? performance.now() : Date.now()) - start;
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

// before 훅이 skip 신호를 반환할 수 있도록 하는 유틸 타입 (미들웨어 구현 선택적)
export interface StrategyChainBeforeResult {
  skip?: boolean;
  reason?: string;
  /**
   * shortCircuit: true 인 경우 전략 실행 루프를 즉시 중단하고 result 를 그대로 반환한다.
   * cache hit 등의 시나리오에서 사용. skip 과 동시에 제공되며 attemptedStrategies 는 비어있어야 한다.
   */
  shortCircuit?: boolean;
  /** shortCircuit 시 반환할 최종 결과 */
  result?: MediaExtractionResult;
}

export class StrategyChainBuilder {
  private readonly strategies: StrategyEntry[] = [];
  private readonly middlewares: StrategyChainMiddleware[] = [];
  private readonly counters = { before: 0, after: 0 };
  // duplicate guard 집계 (빌더 단계에서 스킵된 전략 수)
  private readonly _addedNames = new Set<string>();
  private _duplicateSkipped = 0;
  private _backoffConfig: { baseMs: number } | null = null;

  add(strategy: ExtractionStrategy): this {
    // enableDuplicateGuard() 호출된 뒤에는 동일 이름 전략은 추가하지 않고 카운터만 증가
    if ((this as unknown as { __enableDuplicateGuard?: boolean }).__enableDuplicateGuard) {
      if (this._addedNames.has(strategy.name)) {
        this._duplicateSkipped++;
        return this; // skip push
      }
    }
    this.strategies.push(strategy);
    this._addedNames.add(strategy.name);
    return this;
  }

  /** 병렬 그룹 추가: 모든 전략 동시 실행, 첫 성공 즉시 체인 성공 */
  addParallel(...parallelStrategies: ExtractionStrategy[]): this {
    const group: ExtractionStrategy[] = [];
    for (const s of parallelStrategies) {
      if ((this as unknown as { __enableDuplicateGuard?: boolean }).__enableDuplicateGuard) {
        if (this._addedNames.has(s.name)) {
          this._duplicateSkipped++;
          continue; // skip duplicate
        }
      }
      group.push(s);
      this._addedNames.add(s.name);
    }
    if (group.length > 0) {
      this.strategies.push(group);
    }
    return this;
  }

  /** 재시도(backoff) 지연 설정: baseMs 간격으로 재시도 */
  setBackoff(config: { baseMs: number }): this {
    if (config && typeof config.baseMs === 'number' && config.baseMs >= 0) {
      this._backoffConfig = { baseMs: config.baseMs };
    }
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
      this.counters,
      this._duplicateSkipped,
      this._backoffConfig
    ) as unknown as StrategyChain & { __enableDuplicateGuard?: boolean };
    // 빌더 단계에서 설정된 duplicate guard 플래그를 프록시 인스턴스로 전달
    if ((this as unknown as { __enableDuplicateGuard?: boolean }).__enableDuplicateGuard) {
      chain.__enableDuplicateGuard = true;
    }
    return chain;
  }
}

// 내부 프록시: StrategyChain 인터페이스를 유지하면서 run 훅 확장
class StrategyChainProxyWrapper extends StrategyChain {
  constructor(
    strategies: StrategyEntry[],
    private readonly mws: StrategyChainMiddleware[],
    private readonly counters: { before: number; after: number },
    prefilledDuplicateSkipped = 0,
    private readonly backoffConfig: { baseMs: number } | null = null
  ) {
    super(strategies);
    this._duplicateSkipped = prefilledDuplicateSkipped;
  }
  private readonly _executedNames = new Set<string>();
  private readonly _duplicateSkipped: number = 0; // 초기값은 ctor에서 prefill 가능
  private readonly _strategyRetries: Record<string, number> = {};

  private async executeWithRetry(
    strategy: ExtractionStrategy,
    element: HTMLElement,
    options: MediaExtractionOptions,
    extractionId: string,
    tweetInfo?: TweetInfo
  ): Promise<MediaExtractionResult> {
    const maxRetries = (strategy as unknown as { __retryMax?: number }).__retryMax ?? 0;
    let attempt = 0;
    while (true) {
      const result = await strategy.extract(element, options, extractionId, tweetInfo);
      if (result.success || attempt >= maxRetries) {
        return result;
      }
      attempt++;
      this._strategyRetries[strategy.name] = attempt;
      // backoff 지연 (설정된 경우)
      if (this.backoffConfig && this.backoffConfig.baseMs > 0) {
        await new Promise(res => setTimeout(res, this.backoffConfig.baseMs));
      }
    }
  }

  /** 병렬 그룹 실행: 첫 성공 즉시 반환 */
  protected override async executeParallelGroup(
    strategies: ExtractionStrategy[],
    element: HTMLElement,
    options: MediaExtractionOptions,
    extractionId: string,
    tweetInfo?: TweetInfo
  ): Promise<{
    successResult?: MediaExtractionResult;
    successName?: string;
    failures: string[];
    groupMeta: { groupSize: number };
  }> {
    return new Promise(resolve => {
      let settled = false;
      let remaining = strategies.length;
      const failures: string[] = [];
      for (const s of strategies) {
        this.executeWithRetry(s, element, options, extractionId, tweetInfo)
          .then(result => {
            if (!settled && result.success) {
              settled = true;
              resolve({
                successResult: result,
                successName: s.name,
                failures,
                groupMeta: { groupSize: strategies.length },
              });
              return;
            }
            if (!result.success) failures.push(s.name);
          })
          .catch(() => {
            failures.push(s.name);
          })
          .finally(() => {
            remaining--;
            if (remaining === 0 && !settled) {
              settled = true;
              resolve({ failures, groupMeta: { groupSize: strategies.length } });
            }
          });
      }
    });
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
    for (const entry of this.strategies as StrategyEntry[]) {
      if (Array.isArray(entry)) {
        const group = entry.filter(s => s.canHandle(element, options));
        if (group.length === 0) continue;
        // before 훅: 병렬 그룹 내 각 전략에 대해 호출
        const attemptedNames: string[] = [];
        for (const strategy of group) {
          attemptedNames.push(strategy.name);
          try {
            let skip = false;
            let shortCircuitResult: MediaExtractionResult | undefined;
            for (const mw of this.mws) {
              if (mw.before) {
                const r = (await mw.before(
                  { element, options, extractionId },
                  strategy
                )) as void | StrategyChainBeforeResult;
                this.counters.before++;
                if (r && typeof r === 'object') {
                  if ((r as StrategyChainBeforeResult).skip) skip = true;
                  if ((r as StrategyChainBeforeResult).shortCircuit && r.result) {
                    shortCircuitResult = r.result;
                    // short-circuit 즉시 반환
                    const durationMs = (performance.now ? performance.now() : Date.now()) - start;
                    (
                      this as unknown as { _customMiddlewareCounters?: Record<string, unknown> }
                    )._customMiddlewareCounters = { customMiddlewareCalls: { ...this.counters } };
                    return {
                      result: shortCircuitResult,
                      metrics: {
                        attemptedStrategies: [],
                        successStrategy: shortCircuitResult.metadata?.successStrategy as
                          | string
                          | undefined,
                        failedStrategies: [],
                        totalTried: 0,
                        durationMs,
                        customMiddlewareCalls: { ...this.counters },
                        duplicateSkipped: this._duplicateSkipped || undefined,
                        strategyRetries:
                          Object.keys(this._strategyRetries).length > 0
                            ? { ...this._strategyRetries }
                            : undefined,
                      },
                    };
                  }
                }
              }
            }
            if (skip) continue;
          } catch {
            // before 훅 실패 시 해당 전략만 skip
            continue;
          }
        }
        // attempted 추가 (병렬 그룹 이름들 모두)
        for (const n of attemptedNames) attempted.push(n);
        const parallelStart = performance.now ? performance.now() : Date.now();
        const { successResult, successName, failures, groupMeta } = await this.executeParallelGroup(
          group,
          element,
          options,
          extractionId,
          tweetInfo
        );
        if (successResult && successName) {
          const durationMs = (performance.now ? performance.now() : Date.now()) - start;
          successResult.metadata = {
            ...(successResult.metadata || {}),
            successStrategy: successName,
            attemptedStrategies: [...attempted],
          };
          const winnerLatency = (performance.now ? performance.now() : Date.now()) - parallelStart;
          (
            this as unknown as { _customMiddlewareCounters?: Record<string, unknown> }
          )._customMiddlewareCounters = { customMiddlewareCalls: { ...this.counters } };
          return {
            result: successResult,
            metrics: {
              attemptedStrategies: [...attempted],
              successStrategy: successName,
              failedStrategies: failed,
              totalTried: attempted.length,
              durationMs,
              customMiddlewareCalls: { ...this.counters },
              duplicateSkipped: this._duplicateSkipped || undefined,
              strategyRetries:
                Object.keys(this._strategyRetries).length > 0
                  ? { ...this._strategyRetries }
                  : undefined,
              groupSize: groupMeta?.groupSize,
              winnerLatency,
              losingCancelCount: groupMeta ? groupMeta.groupSize - 1 - failures.length : undefined,
            },
          };
        }
        // 실패 시 실패 목록 업데이트 후 다음 엔트리
        for (const f of failures) failed.push(f);
        continue;
      }
      const strategy = entry as ExtractionStrategy;
      if (!strategy.canHandle(element, options)) continue;
      try {
        let skip = false;
        let shortCircuitResult: MediaExtractionResult | undefined;
        for (const mw of this.mws) {
          if (mw.before) {
            const r = (await mw.before(
              { element, options, extractionId },
              strategy
            )) as void | StrategyChainBeforeResult;
            this.counters.before++;
            if (r && typeof r === 'object') {
              if ((r as StrategyChainBeforeResult).skip) {
                skip = true;
              }
              if ((r as StrategyChainBeforeResult).shortCircuit && r.result) {
                // short-circuit: 즉시 결과 반환 (전략 시도 없이)
                shortCircuitResult = r.result;
                // 결과 메타데이터에 attemptedStrategies 가 없으면 빈 배열 주입 (일관성)
                type Meta = NonNullable<typeof shortCircuitResult>['metadata'] & {
                  attemptedStrategies?: string[];
                  successStrategy?: string;
                };
                if (!shortCircuitResult.metadata) {
                  shortCircuitResult.metadata = { attemptedStrategies: [] } as Meta;
                } else if (!Array.isArray(shortCircuitResult.metadata.attemptedStrategies)) {
                  (shortCircuitResult.metadata as Meta).attemptedStrategies = [];
                }
                const durationMs = (performance.now ? performance.now() : Date.now()) - start;
                (
                  this as unknown as { _customMiddlewareCounters?: Record<string, unknown> }
                )._customMiddlewareCounters = {
                  customMiddlewareCalls: { ...this.counters },
                };
                return {
                  result: shortCircuitResult,
                  metrics: {
                    attemptedStrategies: [],
                    successStrategy: shortCircuitResult.metadata?.successStrategy as
                      | string
                      | undefined,
                    failedStrategies: [],
                    totalTried: 0,
                    durationMs,
                    customMiddlewareCalls: { ...this.counters },
                    duplicateSkipped: this._duplicateSkipped || undefined,
                    strategyRetries:
                      Object.keys(this._strategyRetries).length > 0
                        ? { ...this._strategyRetries }
                        : undefined,
                  },
                };
              }
            }
          }
        }
        if (skip) continue;
        attempted.push(strategy.name);
        this._executedNames.add(strategy.name);
        const result = await this.executeWithRetry(
          strategy,
          element,
          options,
          extractionId,
          tweetInfo
        );
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
              duplicateSkipped: this._duplicateSkipped || undefined,
              strategyRetries:
                Object.keys(this._strategyRetries).length > 0
                  ? { ...this._strategyRetries }
                  : undefined,
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
        duplicateSkipped: this._duplicateSkipped || undefined,
        strategyRetries:
          Object.keys(this._strategyRetries).length > 0 ? { ...this._strategyRetries } : undefined,
      },
    };
  }
}

export function withRetry(strategy: ExtractionStrategy, maxRetries = 1): ExtractionStrategy {
  return Object.assign({}, strategy, { __retryMax: maxRetries });
}

declare module './StrategyChain' {
  interface StrategyChainBuilder {
    enableDuplicateGuard(): this;
    addParallel(...strategies: ExtractionStrategy[]): this;
    setBackoff(config: { baseMs: number }): this;
  }
}

interface StrategyChainBuilderInternal extends StrategyChainBuilder {
  __enableDuplicateGuard?: boolean;
}

(
  StrategyChainBuilder as unknown as {
    prototype: StrategyChainBuilderInternal;
  }
).prototype.enableDuplicateGuard = function (
  this: StrategyChainBuilderInternal
): StrategyChainBuilder {
  this.__enableDuplicateGuard = true;
  return this;
};
