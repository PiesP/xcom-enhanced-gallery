// @vitest-environment jsdom
// RED: StrategyChain 병렬 그룹 & backoff (retry delay) 확장 테스트
// 요구 사항:
// 1. addParallel(...) 로 추가된 전략들은 동시에 시작되고 첫 성공 즉시 체인 종료
// 2. setBackoff({ baseMs }) 구성 시 실패 후 재시도 간 지연 적용 & strategyRetries 메트릭 반영

import { describe, it, expect, vi } from 'vitest';

// declare minimal timer (TypeScript env might miss lib.dom depending on config subset)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare function setTimeout(handler: (...args: any[]) => void, timeout?: number): number;
import {
  StrategyChainBuilder,
  withRetry,
  type StrategyChainMetrics,
} from '@/shared/services/media-extraction/StrategyChain';
import type { ExtractionStrategy } from '@/shared/services/media-extraction/MediaExtractionOrchestrator';
import type { MediaExtractionResult } from '@/shared/types/media.types';

// jsdom 환경에서 setTimeout 존재 가정 (lib.dom)
const makeAsyncStrategy = (
  name: string,
  successDelayMs: number,
  succeed: boolean
): ExtractionStrategy => ({
  name,
  priority: 1,
  canHandle: () => true,
  extract: () =>
    new Promise<MediaExtractionResult>(resolve => {
      setTimeout(() => {
        resolve({
          success: succeed,
          mediaItems: succeed
            ? [
                {
                  id: 'id-' + name,
                  url: 'https://example.com/' + name + '.jpg',
                  type: 'image',
                  filename: name + '.jpg',
                },
              ]
            : [],
          clickedIndex: 0,
          metadata: { strategy: name },
          tweetInfo: null,
          errors: [],
        });
      }, successDelayMs);
    }),
});

describe('[RED] StrategyChain parallel group & backoff', () => {
  it('parallel group: 첫 성공 전략 즉시 반환 & attemptedStrategies 에 병렬 그룹 모두 포함', async () => {
    vi.useFakeTimers();
    const fast = makeAsyncStrategy('fast', 5, true);
    const slow = makeAsyncStrategy('slow', 15, true);

    const chain = new StrategyChainBuilder().addParallel(fast, slow).build();
    const el = (globalThis.document as Document).createElement('div');
    const p = chain.run(el, { mode: 'single' } as any, 'par-test');
    await vi.advanceTimersByTimeAsync(6); // fast 완료 시점 직후
    const { result, metrics } = await p;
    expect(result.success).toBe(true);
    expect(['fast', 'slow']).toEqual(expect.arrayContaining(metrics.attemptedStrategies));
    expect(metrics.successStrategy).toBe('fast');
    vi.useRealTimers();
  });

  it('backoff: 실패 후 재시도 1회 (retry=1) 시 strategyRetries 반영', async () => {
    vi.useFakeTimers();
    let attempt = 0;
    const flaky: ExtractionStrategy = withRetry(
      {
        name: 'flaky',
        priority: 1,
        canHandle: () => true,
        extract: async () => {
          attempt++;
          return {
            success: attempt >= 2, // 1회 실패 후 성공
            mediaItems: attempt >= 2 ? [] : [],
            clickedIndex: 0,
            metadata: { strategy: 'flaky' },
            tweetInfo: null,
            errors: [],
          };
        },
      } as ExtractionStrategy,
      1
    );
    const chain = new StrategyChainBuilder().setBackoff({ baseMs: 20 }).add(flaky).build();
    const el = (globalThis.document as Document).createElement('div');
    const promise = chain.run(el, { mode: 'single' } as any, 'backoff-test');
    // 첫 시도 즉시 실행 -> 두번째는 20ms 후
    await vi.advanceTimersByTimeAsync(19);
    // 아직 성공 전
    let done = false;
    void promise.then(() => (done = true));
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(2); // 21ms total
    const { metrics } = (await promise) as { metrics: StrategyChainMetrics } & any;
    expect(metrics.strategyRetries?.flaky).toBe(1);
    vi.useRealTimers();
  });
});
