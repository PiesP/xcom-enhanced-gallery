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
}

export interface StrategyChainResult {
  result: MediaExtractionResult;
  metrics: StrategyChainMetrics;
}

export class StrategyChain {
  constructor(private readonly strategies: ExtractionStrategy[]) {}

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
          // 메타데이터 주입 (확장)
          result.metadata = {
            ...(result.metadata || {}),
            successStrategy: strategy.name,
            attemptedStrategies: [...attempted],
            strategyChainDuration: durationMs,
          };
          return {
            result,
            metrics: {
              attemptedStrategies: [...attempted],
              successStrategy: strategy.name,
              failedStrategies: failed,
              totalTried: attempted.length,
              durationMs,
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
        strategyChainDuration: durationMs,
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
      },
    };
  }
}
