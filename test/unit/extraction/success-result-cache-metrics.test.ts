// @ts-nocheck
/* eslint-env browser */
/**
 * MediaExtractionOrchestrator 성공 결과 캐시 메트릭 테스트
 */
import { describe, it, expect, vi } from 'vitest';
import { MediaExtractionOrchestrator } from '@/shared/services/media-extraction/MediaExtractionOrchestrator';

function makeStrategy(name, priority, succeed) {
  return {
    name,
    priority,
    canHandle: () => true,
    async extract() {
      return {
        success: succeed,
        mediaItems: succeed ? [{ url: 'x', type: 'image', metadata: {} }] : [],
        clickedIndex: 0,
        metadata: { extractedAt: Date.now(), sourceType: 'test', strategy: name },
        tweetInfo: null,
      };
    },
  };
}

describe('MediaExtractionOrchestrator successResultCache 메트릭', () => {
  it('히트 및 TTL eviction 경로 메트릭 반영', async () => {
    vi.useFakeTimers();
    const orch = new MediaExtractionOrchestrator();
    // @ts-ignore
    orch.addStrategy(makeStrategy('S1', 1, true));
    // 짧은 TTL 설정
    orch.setSuccessCacheTTL(30);

    const el = document.createElement('div');
    // 최초 실행 (miss -> 저장)
    const r1 = await orch.extract(el, {});
    expect(r1.success).toBe(true);
    let om1 = orch.getMetrics();
    expect(om1.successResultCacheHits).toBe(0);
    expect(om1.successResultCacheEvictions).toBe(0);

    // 즉시 재호출 (cache hit)
    const r2 = await orch.extract(el, {});
    expect(r2.metadata.centralMetrics.cacheHit).toBe(true);
    let om2 = orch.getMetrics();
    expect(om2.successResultCacheHits).toBeGreaterThanOrEqual(1);
    expect(om2.successResultCacheEvictions).toBe(0);

    // TTL 경과 후 (eviction + 재추출)
    vi.advanceTimersByTime(40);
    const r3 = await orch.extract(el, {});
    expect(r3.metadata.centralMetrics.cacheHit).toBe(false);
    let om3 = orch.getMetrics();
    expect(om3.successResultCacheEvictions).toBeGreaterThanOrEqual(1);

    vi.useRealTimers();
  });
});
