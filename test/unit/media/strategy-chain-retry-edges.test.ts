// @vitest-environment jsdom
// Phase 11: StrategyChain retry decorator edge cases
import { describe, it, expect } from 'vitest';
import { StrategyChainBuilder, withRetry } from '@/shared/services/media-extraction/StrategyChain';
import type { ExtractionStrategy } from '@/shared/services/media-extraction/MediaExtractionOrchestrator';
import type { MediaExtractionResult } from '@/shared/types/media.types';

const makeStrategy = (name: string, pattern: ('fail' | 'success')[]): ExtractionStrategy => {
  let i = 0;
  return {
    name,
    priority: 1,
    canHandle: () => true,
    extract: async (): Promise<MediaExtractionResult> => {
      const mode = pattern[Math.min(i, pattern.length - 1)];
      i++;
      if (mode === 'fail') {
        return {
          success: false,
          mediaItems: [],
          clickedIndex: 0,
          metadata: { strategy: name },
          tweetInfo: null,
        } as any;
      }
      return {
        success: true,
        mediaItems: [],
        clickedIndex: 0,
        metadata: { strategy: name },
        tweetInfo: null,
      } as any;
    },
  };
};

describe('StrategyChain retry decorator edge cases (GREEN)', () => {
  it('maxRetries=0 은 재시도 없이 1회 실패 후 실패 반환 (strategyRetries undefined)', async () => {
    const s = withRetry(makeStrategy('NO_RETRY', ['fail']), 0);
    const chain = new StrategyChainBuilder().add(s).build();
    const host = (globalThis.document as Document).createElement('div');
    const { result, metrics } = await chain.run(host, {} as any, 'no-retry');
    expect(result.success).toBe(false);
    expect(metrics.strategyRetries).toBeUndefined();
  });

  it('여러 전략 혼합: 첫 전략 실패 후 두 번째 전략 withRetry 성공 / retries 기록', async () => {
    const failThenSuccess = withRetry(makeStrategy('FLAKY', ['fail', 'success']), 1);
    const alwaysSuccess = makeStrategy('ALWAYS', ['success']);
    const chain = new StrategyChainBuilder().add(failThenSuccess).add(alwaysSuccess).build();
    const host = (globalThis.document as Document).createElement('div');
    const { result, metrics } = await chain.run(host, {} as any, 'multi');
    expect(result.success).toBe(true);
    expect(metrics.successStrategy).toBe('FLAKY'); // 첫 전략 재시도 후 성공으로 두 번째 실행 안 됨
    expect(metrics.strategyRetries && metrics.strategyRetries['FLAKY']).toBe(1);
    // attemptedStrategies 에 FLAKY 단일 포함 확인
    expect(metrics.attemptedStrategies).toEqual(['FLAKY']);
  });
});
