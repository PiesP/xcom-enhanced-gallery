// GREEN 테스트: StrategyChain DSL middleware 훅 검증
// 목적: builder 기반 체인 구성 시 middleware(before/after 훅) 호출 및 metrics 반영
// 전략: StrategyChainBuilder().use(mw).add(strategy).build().run(...)
// 기대: mw.before / mw.after 훅 각각 1회 호출되고 metrics.customMiddlewareCalls 에 카운트 노출

import { describe, it, expect } from 'vitest';
import {
  StrategyChainBuilder,
  type StrategyChainMiddleware,
} from '@/shared/services/media-extraction/StrategyChain';
import type { MediaExtractionOptions, MediaExtractionResult } from '@/shared/types/media.types';
import type { ExtractionStrategy } from '@/shared/services/media-extraction/MediaExtractionOrchestrator';

// globals (jsdom 테스트 환경에서 제공되지만 ESLint no-undef 회피)

declare const document: Document;
declare function setTimeout(): any;

// 테스트용 간단 전략 팩토리
const makeStrategy = (name: string, succeed: boolean, delay = 0): ExtractionStrategy => ({
  name,
  priority: 1,
  canHandle: () => true,
  extract: async (): Promise<MediaExtractionResult> => {
    if (delay)
      await new Promise(res => {
        setTimeout(() => res(undefined), delay);
      });
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

describe('StrategyChain DSL middleware 훅', () => {
  it('before/after 훅 호출 횟수를 metrics.customMiddlewareCalls 로 노출한다', async () => {
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

    const element = document.createElement('div');
    const options = { mode: 'single' } as unknown as MediaExtractionOptions; // 최소 속성

    const { metrics, result } = await chain.run(element, options, 'test');

    expect(result.success).toBe(true);
    expect(metrics.customMiddlewareCalls?.before).toBe(1);
    expect(metrics.customMiddlewareCalls?.after).toBe(1);
    expect(calls).toEqual(['b:A', 'a:A']);
  });
});
