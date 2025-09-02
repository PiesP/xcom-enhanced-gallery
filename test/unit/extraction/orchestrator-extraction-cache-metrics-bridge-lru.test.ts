// @vitest-environment jsdom
// @ts-nocheck
/**
 * Phase 11 HARDEN: Orchestrator.getMetrics() LRU eviction 브리지 검증
 */
import { describe, it, expect } from 'vitest';
import { MediaExtractionCache } from '@shared/services/media-extraction/MediaExtractionCache';
import { MediaExtractionOrchestrator } from '@shared/services/media-extraction/MediaExtractionOrchestrator';

function makeResult(id) {
  return {
    success: true,
    mediaItems: [
      {
        id,
        url: `https://pbs.twimg.com/media/${id}.jpg?format=jpg&name=orig`,
        type: 'image',
        filename: 'm.jpg',
      },
    ],
    clickedIndex: 0,
    metadata: { extractedAt: Date.now(), sourceType: 'api-first', strategy: 'mock' },
    tweetInfo: {
      tweetId: id,
      username: 'lru_user',
      tweetUrl: '',
      extractionMethod: 'mock',
      confidence: 1,
    },
  };
}

describe('Phase 11 HARDEN: Orchestrator extractionCache_lruEvictions 브리지', () => {
  it('maxEntries 초과로 LRU eviction 발생 시 Orchestrator 메트릭 반영', () => {
    const cache = new MediaExtractionCache({ maxEntries: 2, ttlMs: 10_000, purgeIntervalMs: 0 });
    cache.set('a', makeResult('a'));
    cache.set('b', makeResult('b'));
    // a 가 가장 오래된 상태, c 추가 시 a 제거 (lruEvictions 1)
    cache.set('c', makeResult('c'));
    const raw = cache.getMetrics();
    expect(raw.lruEvictions).toBe(1);
    const orch = new MediaExtractionOrchestrator(undefined, cache);
    const m = orch.getMetrics();
    expect(m.extractionCache_lruEvictions).toBe(1);
    expect(m.extractionCache_ttlEvictions).toBe(raw.ttlEvictions);
  });
});
