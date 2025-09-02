// RED 테스트: StrategyChain DSL retry decorator
// 기대: 실패 후 1회 재시도로 성공, metrics.strategyRetries['RETRY'] === 1
// 현재 retry 미구현으로 실패 (success=false or strategyRetries undefined)

import { describe, it, expect } from 'vitest';
import { StrategyChainBuilder } from '@/shared/services/media-extraction/StrategyChain';
import type { ExtractionStrategy } from '@/shared/services/media-extraction/MediaExtractionOrchestrator';
import type { MediaExtractionResult } from '@/shared/types/media.types';

const makeFlakyStrategy = (name: string): ExtractionStrategy => {
  let attempt = 0;
  return {
    name,
    priority: 1,
    canHandle: () => true,
    extract: async (): Promise<MediaExtractionResult> => {
      attempt++;
      if (attempt === 1) {
        return {
          success: false,
          mediaItems: [],
          clickedIndex: 0,
          metadata: { attempt, strategy: name },
          tweetInfo: null,
        };
      }
      return {
        success: true,
        mediaItems: [],
        clickedIndex: 0,
        metadata: { attempt, strategy: name },
        tweetInfo: null,
      };
    },
  };
};

describe('StrategyChain DSL retry decorator', () => {
  it('최대 1회 재시도 후 성공 시 strategyRetries["RETRY"] = 1 기록 (RED)', async () => {
    const flaky = makeFlakyStrategy('RETRY');
    // (GREEN 단계에서 retry 데코레이터 적용 예정) 지금은 그냥 추가 → 첫 실패로 전체 실패 or successStrategy 첫 실패 처리
    const chain = new StrategyChainBuilder().add(flaky).build();

    const el = (globalThis.document as Document).createElement('div');
    const { metrics, result } = await chain.run(el, { mode: 'single' } as any, 'retry-test');

    expect(result.success).toBe(true); // RED: 현재는 false일 가능성 높음
    expect(metrics.strategyRetries && metrics.strategyRetries['RETRY']).toBe(1); // RED: undefined → 실패
  });
});
