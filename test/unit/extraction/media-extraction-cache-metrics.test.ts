// @ts-nocheck
/**
 * MediaExtractionCache 메트릭 GREEN 테스트
 * 요구 변화:
 * - missCount: 이제 get / getStatus 조회 실패(존재X 또는 만료) 시에만 증가 (set 시 증가 제거)
 * - 분리된 eviction 메트릭: lruEvictions, ttlEvictions (evictionCount = 합계 for backward compat)
 * - hitRatio = hit / (hit + miss) (분모 0 보호)
 */
import { describe, it, expect, vi } from 'vitest';
import { MediaExtractionCache } from '@/shared/services/media-extraction/MediaExtractionCache';

function makeResult(_id) {
  return {
    success: true,
    mediaItems: [],
    clickedIndex: 0,
    metadata: { strategy: 't', sourceType: 't', extractedAt: Date.now() },
    tweetInfo: null,
    errors: [],
  };
}

describe('MediaExtractionCache 메트릭', () => {
  it('lookup miss / hit 및 LRU / TTL eviction 메트릭 분리 검증', () => {
    vi.useFakeTimers();
    const cache = new MediaExtractionCache({ maxEntries: 2, ttlMs: 50 });

    // 초기 메트릭
    let m = cache.getMetrics();
    expect(m.hitCount).toBe(0);
    expect(m.missCount).toBe(0);
    expect(m.lruEvictions).toBe(0);
    expect(m.ttlEvictions).toBe(0);

    // miss 조회
    expect(cache.get('a')).toBeUndefined();
    m = cache.getMetrics();
    expect(m.missCount).toBe(1);
    expect(m.hitCount).toBe(0);

    // set 은 miss 증가시키지 않는다
    cache.set('a', makeResult('a'));
    cache.set('b', makeResult('b'));
    m = cache.getMetrics();
    expect(m.missCount).toBe(1);
    expect(m.hitCount).toBe(0);

    // hit
    expect(cache.get('a')).toBeTruthy();
    m = cache.getMetrics();
    expect(m.hitCount).toBe(1);
    expect(m.missCount).toBe(1);

    // LRU eviction (b 제거 예상: a 를 최근에 touch 했으므로)
    cache.set('c', makeResult('c'));
    m = cache.getMetrics();
    expect(m.lruEvictions).toBe(1);
    expect(m.ttlEvictions).toBe(0);
    expect(m.evictionCount).toBe(m.lruEvictions + m.ttlEvictions);

    // TTL 만료 유도: 남은 a,c 둘 다 만료시키고 조회 -> ttlEvictions 증가
    vi.advanceTimersByTime(60);
    expect(cache.get('a')).toBeUndefined(); // expired → miss + ttlEvictions
    m = cache.getMetrics();
    expect(m.ttlEvictions).toBeGreaterThanOrEqual(1);
    expect(m.evictionCount).toBe(m.lruEvictions + m.ttlEvictions);
    expect(m.missCount).toBeGreaterThan(1);
    expect(m.hitRatio).toBeGreaterThan(0); // 최소 한 번 hit 경험

    vi.useRealTimers();
  });

  it('TTL 만료가 정확히 ttlEvictions 를 증가시키고 missCount 에 반영된다', () => {
    vi.useFakeTimers();
    const cache = new MediaExtractionCache({ maxEntries: 5, ttlMs: 10 });
    cache.set('x', makeResult('x'));
    // 아직 만료 전
    expect(cache.get('x')).toBeTruthy();
    let m = cache.getMetrics();
    expect(m.hitCount).toBe(1);
    expect(m.ttlEvictions).toBe(0);

    // 만료 후 조회 -> miss + ttlEviction
    vi.advanceTimersByTime(15);
    expect(cache.get('x')).toBeUndefined();
    m = cache.getMetrics();
    expect(m.ttlEvictions).toBe(1);
    expect(m.lruEvictions).toBe(0);
    expect(m.missCount).toBe(1); // 이전 hit 이후 처음 miss
    expect(m.hitRatio).toBeCloseTo(1 / 2); // hit 1 / (hit1+miss1)
    vi.useRealTimers();
  });
});
