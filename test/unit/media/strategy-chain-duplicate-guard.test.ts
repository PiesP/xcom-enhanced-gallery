// RED 테스트: StrategyChain DSL duplicate guard 미들웨어
// 기대: 동일 이름 전략이 체인에 2회 추가되었을 때 2번째 실행이 스킵되고 metrics.duplicateSkipped == 1
// 현재 구현에는 duplicate guard 미구현이므로 실패 (duplicateSkipped undefined or 0)

import { describe, it, expect } from 'vitest';
import { StrategyChainBuilder } from '@/shared/services/media-extraction/StrategyChain';
import type { ExtractionStrategy } from '@/shared/services/media-extraction/MediaExtractionOrchestrator';
import type { MediaExtractionResult } from '@/shared/types/media.types';

const makeStrategy = (name: string, succeed: boolean): ExtractionStrategy => ({
  name,
  priority: 1,
  canHandle: () => true,
  extract: async (): Promise<MediaExtractionResult> =>
    succeed
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
        },
});

describe('StrategyChain DSL duplicate guard 미들웨어', () => {
  it('동일 이름 전략 두 번째는 실행 스킵되고 duplicateSkipped=1 메트릭스 노출 (RED)', async () => {
    const s1 = makeStrategy('SAME', true);
    const s2 = makeStrategy('SAME', true); // 이름 중복

    // (추후 GREEN 단계) .enableDuplicateGuard() 같은 API 사용할 예정
    const chain = new StrategyChainBuilder().add(s1).add(s2).build();

    const element = (globalThis.document as Document).createElement('div');
    const { metrics, result } = await chain.run(element, { mode: 'single' } as any, 'dup-test');

    expect(result.success).toBe(true);
    // RED: 아직 duplicateSkipped 메트릭이 존재하지 않거나 0일 것이므로 실패 유도
    expect(metrics.duplicateSkipped).toBe(1);
    expect(metrics.attemptedStrategies).toEqual(['SAME']); // 두 번째는 시도 목록에 없어야 함
  });
});
