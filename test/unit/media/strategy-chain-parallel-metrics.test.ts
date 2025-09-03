// @vitest-environment jsdom
// RED: StrategyChain 병렬 메트릭 확장 (groupSize, winnerLatency, losingCancelCount)
import { describe, it, expect, vi } from 'vitest';
import { StrategyChainBuilder } from '@/shared/services/media-extraction/StrategyChain';
import type { ExtractionStrategy } from '@/shared/services/media-extraction/MediaExtractionOrchestrator';
import type { MediaExtractionResult } from '@/shared/types/media.types';

const mk = (name: string, delay: number, succeed: boolean): ExtractionStrategy => ({
  name,
  priority: 1,
  canHandle: () => true,
  extract: () =>
    new Promise<MediaExtractionResult>(res => {
      globalThis.setTimeout(() => {
        res({
          success: succeed,
          mediaItems: succeed ? [] : [],
          clickedIndex: 0,
          metadata: { strategy: name },
          tweetInfo: null,
          errors: [],
        });
      }, delay);
    }),
});

describe('[RED] StrategyChain parallel metrics', () => {
  it('groupSize / winnerLatency / losingCancelCount 메트릭 노출', async () => {
    vi.useFakeTimers();
    const a = mk('A', 30, true);
    const b = mk('B', 60, true);
    const c = mk('C', 80, false);
    const chain = new StrategyChainBuilder().addParallel(a, b, c).build();
    const el = (globalThis.document as Document).createElement('div');
    const p = chain.run(el, { mode: 'single' } as any, 'parallel-metrics');
    await vi.advanceTimersByTimeAsync(35); // A only finished
    const { metrics } = await p;
    expect(metrics.successStrategy).toBe('A');
    // 기대: groupSize === 3
    expect((metrics as any).groupSize).toBe(3);
    // 기대: winnerLatency 약 30ms (허용 오차 10ms)
    expect(Math.abs(((metrics as any).winnerLatency ?? 0) - 30)).toBeLessThanOrEqual(10);
    // 기대: losingCancelCount === 2 (B,C 두 개 취소)
    expect((metrics as any).losingCancelCount).toBe(2);
    vi.useRealTimers();
  });
});
