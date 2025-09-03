// @vitest-environment jsdom
// Phase11 RED: StrategyChain duplicate guard & retry decorator 동작
// 목표(GREEN):
// 1) enableDuplicateGuard() 사용 시 동일 이름 전략 두 번째 추가는 skipped (metrics.duplicateSkipped 증가)
// 2) withRetry() 래핑된 전략 실패 후 재시도(maxRetries=1) 1회 수행 → 두 번째 시도에서 success 반환 시 전체 success
// 현재 구현 상태 점검:
// - enableDuplicateGuard(): 존재 (Builder 확장) -> duplicateSkipped 메트릭 반영 여부 확인 필요
// - withRetry(): 존재하나 metrics.strategyRetries 노출 및 성공 전파 검증 필요
// RED 조건: 아래 테스트 중 아직 구현 부족 시 실패하도록 단언

import { describe, it, expect } from 'vitest';
import { StrategyChainBuilder, withRetry } from '@/shared/services/media-extraction/StrategyChain';
import type { ExtractionStrategy } from '@/shared/services/media-extraction/MediaExtractionOrchestrator';

// 헬퍼: 생성 실패 후 두 번째 호출에서 성공하도록 상태를 유지하는 전략
function createFlakyStrategy(name: string, failCount = 1): ExtractionStrategy {
  let attempts = 0;
  return {
    name,
    priority: 1,
    canHandle: () => true,
    async extract() {
      attempts++;
      if (attempts <= failCount) {
        return {
          success: false,
          mediaItems: [],
          clickedIndex: 0,
          metadata: { extractedAt: Date.now(), sourceType: 'test', strategy: name },
          tweetInfo: null,
        } as any;
      }
      return {
        success: true,
        mediaItems: [
          {
            id: 'm1',
            url: 'u',
            type: 'image',
            originalUrl: 'u',
            filename: 'f',
            tweetId: undefined,
            tweetUsername: undefined,
          },
        ],
        clickedIndex: 0,
        metadata: { extractedAt: Date.now(), sourceType: 'test', strategy: name },
        tweetInfo: null,
      } as any;
    },
  };
}

describe('StrategyChain duplicate guard + retry decorator', () => {
  it('enableDuplicateGuard 사용 시 동일 이름 전략 두 번째 추가는 skip 되고 메트릭이 반영된다 (GREEN)', async () => {
    const builder = new StrategyChainBuilder().enableDuplicateGuard();
    const s1 = createFlakyStrategy('dup', 0);
    const s2 = createFlakyStrategy('dup', 0); // 동일 이름
    builder.add(s1).add(s2); // 두 번째는 skip 되어야 함 (GREEN 기대)
    const chain = builder.build();
    // eslint-disable-next-line no-undef
    const host = typeof document !== 'undefined' ? document.createElement('div') : ({} as any);
    const { metrics } = await chain.run(host as any, {}, 'dup_guard');
    // GREEN: duplicateSkipped > 0 이고 실제 실행은 1회만 이뤄진다
    expect(metrics.duplicateSkipped).toBeGreaterThan(0);
    expect(metrics.attemptedStrategies.filter(n => n === 'dup').length).toBe(1);
    expect(metrics.totalTried).toBe(1);
  });

  it('withRetry 래핑된 전략은 1회 실패 후 재시도하여 성공하고 재시도 메트릭을 노출한다 (GREEN)', async () => {
    const flaky = withRetry(createFlakyStrategy('flaky', 1), 1); // 첫 시도 실패, 두 번째 성공
    const builder = new StrategyChainBuilder();
    builder.add(flaky);
    const chain = builder.build();
    // eslint-disable-next-line no-undef
    const host = typeof document !== 'undefined' ? document.createElement('div') : ({} as any);
    const { result, metrics } = await chain.run(host as any, {}, 'retry_case');
    // GREEN: 첫 실패 후 1회 재시도로 성공해야 함
    expect(result.success).toBe(true);
    expect(metrics.strategyRetries).toBeDefined();
    expect(metrics.strategyRetries && metrics.strategyRetries['flaky']).toBe(1);
    expect(metrics.successStrategy).toBe('flaky');
  });
});
