// @vitest-environment jsdom
// @ts-nocheck
/**
 * Phase 11 HARDEN: Orchestrator.getMetrics() 가 MediaExtractionCache 메트릭(prefixed extractionCache_)을 올바르게 투영하는지 검증
 */
import { describe, it, expect, vi } from 'vitest';
import { MediaExtractionCache } from '@shared/services/media-extraction/MediaExtractionCache';
import { MediaExtractionOrchestrator } from '@shared/services/media-extraction/MediaExtractionOrchestrator';

function makeResult() {
  return {
    success: true,
    mediaItems: [
      {
        id: 'id',
        url: 'https://pbs.twimg.com/media/cache_bridge.jpg?format=jpg&name=orig',
        type: 'image',
        filename: 'media_1.jpg',
      },
    ],
    clickedIndex: 0,
    metadata: { extractedAt: Date.now(), sourceType: 'api-first', strategy: 'mock' },
    tweetInfo: {
      tweetId: 'bridge1',
      username: 'bridge_user',
      tweetUrl: '',
      extractionMethod: 'mock',
      confidence: 1,
    },
  };
}

describe('Phase 11 HARDEN: Orchestrator extractionCache_* 메트릭 브리지', () => {
  it('TTL 만료 후 cache.get() → ttlEvictions Orchestrator 메트릭 반영', () => {
    vi.useFakeTimers();
    const cache = new MediaExtractionCache({ ttlMs: 10, maxEntries: 5, purgeIntervalMs: 0 });
    cache.set('bridge1', makeResult());
    vi.advanceTimersByTime(15); // expire
    expect(cache.get('bridge1')).toBeUndefined(); // trigger ttlEvictions
    const raw = cache.getMetrics();
    expect(raw.ttlEvictions).toBe(1);
    const orch = new MediaExtractionOrchestrator(undefined, cache);
    const m = orch.getMetrics();
    expect(m.extractionCache_ttlEvictions).toBe(1);
    expect(m.extractionCache_missCount).toBe(raw.missCount);
    vi.useRealTimers();
  });
});
