/**
 * RED: MediaExtractionCache 메트릭 (hit/miss/eviction/hitRatio) 노출 요구
 * 현재 구현: get/set/getStatus 만 있고 메트릭 수집/노출 없음 -> 실패해야 함
 */
import { describe, it, expect, vi } from 'vitest';
import { MediaExtractionCache } from '@/shared/services/media-extraction/MediaExtractionCache';

function makeResult(id) {
  return {
    success: true,
    mediaItems: [],
    clickedIndex: 0,
    metadata: { strategy: 't', sourceType: 't', extractedAt: Date.now() },
    tweetInfo: null,
    errors: [],
  } as any;
}

describe('RED: MediaExtractionCache 메트릭', () => {
  it('hit/miss/eviction/hitRatio getMetrics() 제공 (RED)', () => {
    vi.useFakeTimers();
    const cache = new MediaExtractionCache({ maxEntries: 2, ttlMs: 5 });
    // miss
    expect(cache.get('a')).toBeUndefined();
    // set a,b
    cache.set('a', makeResult('a'));
    cache.set('b', makeResult('b'));
    // hit a
    expect(cache.get('a')).toBeTruthy();
    // insert c -> LRU eviction of b (or a depending usage)
    cache.set('c', makeResult('c'));
    // advance time to expire one entry
    vi.advanceTimersByTime(10);
    cache.get('a'); // likely expired
    // RED 기대: getMetrics 존재 및 필드 확인
    // @ts-ignore - 존재 예상
    const metrics = cache.getMetrics?.();
    expect(metrics, 'getMetrics 반환 필요').toBeDefined();
    expect(metrics.hitCount).toBeGreaterThanOrEqual(1);
    expect(metrics.missCount).toBeGreaterThanOrEqual(1);
    expect(metrics.evictionCount).toBeGreaterThanOrEqual(1);
    expect(metrics.hitRatio).toBeGreaterThan(0);
    vi.useRealTimers();
  });
});
