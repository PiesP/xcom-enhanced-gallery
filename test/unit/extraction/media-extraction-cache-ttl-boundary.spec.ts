// RED 테스트: MediaExtractionCache TTL 경계/퍼지 비활성 시나리오
// 목표: ttlMs 초과 직전에는 get() 성공, 초과 직후에는 miss + ttlEvictions 상승
// purgeIntervalMs=0 설정 시 interval purge 비활성 (purgeIntervalActive=false)
// 현재 구현은 경계 직후 setTimeout 경합/밀리초 오차 처리 가능 → 경계 테스트로 안정성 확보
import { describe, it, expect, vi } from 'vitest';
import { MediaExtractionCache } from '@/shared/services/media-extraction/MediaExtractionCache';
import type { MediaExtractionResult } from '@/shared/types/media.types';

const makeResult = (id: string): MediaExtractionResult => ({
  success: true,
  mediaItems: [{ id, url: `https://example.com/${id}.jpg`, type: 'image', filename: `${id}.jpg` }],
  clickedIndex: 0,
  metadata: { strategy: 'test', extractedAt: Date.now() },
  tweetInfo: null,
});

describe('[RED] MediaExtractionCache TTL 경계 & purge 비활성', () => {
  it('TTL 직전 hit, 직후 miss + ttlEvictions=1, purgeInterval 비활성', () => {
    vi.useFakeTimers();
    const cache = new MediaExtractionCache({ ttlMs: 20, maxEntries: 5, purgeIntervalMs: 0 });
    cache.set('k1', makeResult('k1'));
    // 10ms 진행: 아직 TTL 전
    vi.advanceTimersByTime(10);
    expect(cache.get('k1')?.success).toBe(true); // hit
    // 다시 set 해서 갱신 (남은 만료 테스트 단순화)
    cache.set('k1', makeResult('k1b'));
    vi.advanceTimersByTime(21); // TTL 초과
    expect(cache.get('k1')).toBeUndefined(); // miss + ttlEvictions 증가 기대
    const m = cache.getMetrics();
    expect(m.ttlEvictions).toBeGreaterThanOrEqual(1);
    expect(m.purgeIntervalActive).toBe(false);
    vi.useRealTimers();
  });
});
