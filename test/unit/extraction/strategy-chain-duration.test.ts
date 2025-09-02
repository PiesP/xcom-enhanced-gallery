// @ts-nocheck
/* eslint-env browser */
/**
 * StrategyChain durationMs 측정 테스트
 */
import { describe, it, expect, vi } from 'vitest';
import { StrategyChain } from '@/shared/services/media-extraction/StrategyChain';

function slowStrategy(name, priority, delayMs, succeed) {
  return {
    name,
    priority,
    canHandle: () => true,
    async extract() {
      const timerFn =
        globalThis && globalThis.setTimeout
          ? globalThis.setTimeout
          : function (fn) {
              /* no-op timer fallback */ fn();
              return 0;
            };
      await new Promise(r => timerFn(r, delayMs));
      return {
        success: succeed,
        mediaItems: [],
        clickedIndex: 0,
        metadata: { extractedAt: Date.now(), sourceType: 'test', strategy: name },
        tweetInfo: null,
      };
    },
  };
}

describe('StrategyChain durationMs', () => {
  it('누적 실행 시간(ms)을 durationMs에 기록한다', async () => {
    vi.useFakeTimers();
    const chain = new StrategyChain([
      slowStrategy('A', 1, 40, false),
      slowStrategy('B', 2, 30, true),
    ]);
    const element =
      globalThis && globalThis.document && globalThis.document.createElement
        ? globalThis.document.createElement('div')
        : { tagName: 'DIV' };
    const runPromise = chain.run(element, {}, 'id1');
    // 두 단계 지연 총 70ms 진행
    await vi.advanceTimersByTimeAsync(70);
    const { metrics, result } = await runPromise;
    expect(metrics.successStrategy).toBe('B');
    expect(metrics.attemptedStrategies).toEqual(['A', 'B']);
    expect(metrics.durationMs).toBeGreaterThanOrEqual(70);
    // legacy strategyChainDuration 메타 필드는 제거되었음 (centralMetrics.durationMs 로 대체)
    expect(result.metadata.strategyChainDuration).toBeUndefined();
    vi.useRealTimers();
  });
});
