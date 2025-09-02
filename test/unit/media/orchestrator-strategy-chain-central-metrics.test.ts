// @vitest-environment jsdom
// jsdom document 가 인식되지 않는 린트 환경 대비 간단 fallback
// jsdom document (fallback unsafe access)
// @ts-ignore
const _doc = typeof document !== 'undefined' ? document : globalThis.document;
/**
 * StrategyChain 메트릭 중앙화 테스트 (이전 RED → 현재 GREEN)
 */
import { describe, it, expect } from 'vitest';
import { MediaExtractionOrchestrator } from '@/shared/services/media-extraction/MediaExtractionOrchestrator';

function makeStrategy(name: string, priority: number, succeed = true) {
  return {
    name,
    priority,
    canHandle: () => true,
    async extract(): Promise<any> {
      const mediaItems = succeed
        ? [
            {
              id: 'media-' + name,
              url: 'https://example.com/' + name + '.jpg',
              type: 'image',
              filename: name + '.jpg',
            },
          ]
        : [];
      return {
        success: succeed,
        mediaItems,
        clickedIndex: 0,
        metadata: { extractedAt: Date.now(), sourceType: 'central-test', strategy: name },
        tweetInfo: null,
        errors: [],
      };
    },
  };
}

describe('StrategyChain centralMetrics', () => {
  it('StrategyChain / success-result-cache / cached-strategy 경로 centralMetrics 유지', async () => {
    const orch = new MediaExtractionOrchestrator();
    orch.addStrategy(makeStrategy('first-fail', 1, false));
    orch.addStrategy(makeStrategy('second-success', 2, true));

    const el1 = _doc.createElement('img');
    el1.setAttribute('src', 'sig.jpg');

    const r1 = await orch.extract(el1, {});
    expect(r1.success).toBe(true);
    expect(r1.metadata && r1.metadata.centralMetrics).toBeDefined();

    const r2 = await orch.extract(el1, {});
    expect(r2.success).toBe(true);
    expect(r2.metadata && r2.metadata.centralMetrics).toBeDefined();
    expect(
      r2.metadata && r2.metadata.centralMetrics && (r2.metadata.centralMetrics as any).cacheHit
    ).toBe(true);

    const el2 = _doc.createElement('img');
    el2.setAttribute('src', 'sig.jpg');
    const r3 = await orch.extract(el2, {});
    expect(r3.success).toBe(true);
    expect(r3.metadata && r3.metadata.centralMetrics).toBeDefined();
    expect(
      r3.metadata && r3.metadata.centralMetrics && (r3.metadata.centralMetrics as any).source
    ).toBe('cached-strategy');
  });
});
