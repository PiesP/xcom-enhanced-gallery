// @vitest-environment jsdom
/**
 * StrategyChain metadata에서 legacy strategyChainDuration 필드 제거 예정 (현재 존재) → RED
 * 목표: duration 노출은 중앙 centralMetrics(durationMs) 집계로만 유지.
 */
import { describe, it, expect } from 'vitest';
import { StrategyChain } from '@shared/services/media-extraction/StrategyChain';

function makeSuccessStrategy(name: string, mediaId: string) {
  return {
    name,
    priority: 1,
    canHandle: () => true,
    async extract(): Promise<any> {
      return {
        success: true,
        mediaItems: [
          {
            id: mediaId,
            url: `https://example.com/${mediaId}.jpg`,
            type: 'image',
            filename: mediaId + '.jpg',
          },
        ],
        clickedIndex: 0,
        metadata: { sourceType: 'strategy-chain-metadata-cleanup', strategy: name },
        tweetInfo: null,
        errors: [],
      };
    },
  };
}

describe('StrategyChain metadata legacy cleanup (strategyChainDuration 제거)', () => {
  it('StrategyChain 실행 결과 metadata에 strategyChainDuration 이 없어야 한다 (현재 존재하면 RED)', async () => {
    const chain = new StrategyChain([makeSuccessStrategy('S1', 'm1')]);
    const el = (globalThis.document || { createElement: () => ({}) }).createElement(
      'div'
    ) as HTMLElement;
    const { result, metrics } = await chain.run(el, {}, 'test');
    // RED 단계: 아직 StrategyChain 이 strategyChainDuration 을 주입하므로 실패 예상
    expect((result.metadata as any)?.strategyChainDuration).toBeUndefined();
    expect(metrics.durationMs).toBeGreaterThanOrEqual(0);
  });
});
