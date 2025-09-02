// RED 테스트: StrategyChain DSL 1차 스캐폴드
// 목표: 체인 구성 시 middleware(step 전/후 훅) 삽입을 지원하는 builder 도입
// 현재 StrategyChain 은 단순 for-loop; 미들웨어 주입 기능이 없어 아래 기대 동작이 실패(RED) 해야 한다.
// GREEN: StrategyChainBuilder().use(mw).add(strategy).run(...)
//       mw.before / mw.after 훅이 호출되어 metric 에 기록되는 것을 검증

import { describe, it, expect } from 'vitest';
import {
  StrategyChainBuilder,
  type StrategyChainMiddleware,
} from '@/shared/services/media-extraction/StrategyChain';
import type { MediaExtractionOptions, MediaExtractionResult } from '@/shared/types/media.types';
import type { ExtractionStrategy } from '@/shared/services/media-extraction/MediaExtractionOrchestrator';

// 테스트용 간단 전략
const makeStrategy = (
  name: string,
  succeed: boolean,
  delay = 0
): ExtractionStrategy => ({
  name,
  priority: 1,
  canHandle: () => true,
  extract: async (): Promise<MediaExtractionResult> => {
    if (delay) await new Promise(r => globalThis.setTimeout(r, delay));
    return succeed
      ? {
          success: true,
          mediaItems: [],
          clickedIndex: 0,
          metadata: { strategy: name },
          tweetInfo: null,
        }
      : {
          success: false,
          mediaItems: [],
          clickedIndex: 0,
          metadata: { strategy: name },
          tweetInfo: null,
        };
  },
});

describe('[RED] StrategyChain DSL middleware 훅', () => {
  it('미들웨어 before/after 훅 호출 횟수를 metrics.customMiddlewareCalls 로 노출한다', async () => {
    const s1 = makeStrategy('A', true);
    const calls: string[] = [];
    const mw: StrategyChainMiddleware = {
      before: (_ctx, strategy) => {
        calls.push(`b:${strategy.name}`);
      },
      after: (_ctx, strategy) => {
        calls.push(`a:${strategy.name}`);
      },
    };
    const chain = new StrategyChainBuilder().use(mw).add(s1).build();

  const element = globalThis.document!.createElement('div');
    const options = { mode: 'single' } as unknown as MediaExtractionOptions; // 최소 속성

    const { metrics, result } = await chain.run(element, options, 'test');

    expect(result.success).toBe(true);
    expect(metrics.customMiddlewareCalls?.before).toBe(1);
    expect(metrics.customMiddlewareCalls?.after).toBe(1);
    expect(calls).toEqual(['b:A', 'a:A']);
  });
});
