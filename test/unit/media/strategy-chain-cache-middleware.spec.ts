// RED 테스트: StrategyChain DSL cache/short-circuit middleware 확장
// 목표: middleware.before 가 { skip:true, shortCircuit:true, result } 객체를 반환하면
//  체인은 해당 result 를 즉시 반환(전략 실행/시도 목록 비움), metrics.attemptedStrategies === [] 유지
// 현재 구현은 skip 플래그만 처리하며 shortCircuit + result 전달 기능 없음 → 실패해야 함.
/* eslint-env jsdom */
import { describe, it, expect } from 'vitest';
import {
  StrategyChainBuilder,
  type StrategyChainMiddleware,
} from '@/shared/services/media-extraction/StrategyChain';
import type { ExtractionStrategy } from '@/shared/services/media-extraction/MediaExtractionOrchestrator';
import type { MediaExtractionResult } from '@/shared/types/media.types';

const makeStrategy = (name: string): ExtractionStrategy => ({
  name,
  priority: 1,
  canHandle: () => true,
  extract: async (): Promise<MediaExtractionResult> => ({
    success: true,
    mediaItems: [],
    clickedIndex: 0,
    metadata: { strategy: name },
    tweetInfo: null,
  }),
});

describe('[RED] StrategyChain cache short-circuit middleware', () => {
  it('cache 미들웨어가 전략 실행 없이 성공 결과를 단락(short-circuit) 반환한다', async () => {
    const s1 = makeStrategy('A');
    const cachedResult: MediaExtractionResult = {
      success: true,
      mediaItems: [
        {
          id: 'cached',
          url: 'https://example.com/cached.jpg',
          type: 'image',
          filename: 'cached.jpg',
        },
      ],
      clickedIndex: 0,
      metadata: { strategy: 'cache-hit', fromCache: true },
      tweetInfo: null,
    };

    const cacheMw: StrategyChainMiddleware = {
      // 현재 타입에는 result / shortCircuit 없음 -> any 캐스팅으로 RED 표현
      // 기대: 구현 후 before 훅이 반환한 result 로 즉시 종료
      before: () => ({ skip: true, shortCircuit: true, result: cachedResult }) as any,
    };

    const chain = new StrategyChainBuilder().use(cacheMw).add(s1).build();
    const el = (globalThis as any).document.createElement('div');
    const { result, metrics } = await chain.run(el, { mode: 'single' } as any, 'cache-short');

    // 기대: 성공 + fromCache 메타 + attemptedStrategies 비어있음 (전략 실행 안됨)
    expect(result.success).toBe(true);
    expect(result.metadata?.fromCache).toBe(true);
    expect(metrics.attemptedStrategies).toEqual([]);
  });
});
