// @vitest-environment jsdom
// Phase 11 HARDEN: Cache TTL 경계 스트레스 테스트 (소형 TTL 다수 키 만료 직후 miss & ttlEvictions 누적)
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

describe('MediaExtractionCache TTL stress (GREEN)', () => {
  it('다수 키 TTL 경과 후 순차 조회 시 ttlEvictions 누적된다', () => {
    vi.useFakeTimers();
    const cache = new MediaExtractionCache({ ttlMs: 30, maxEntries: 10, purgeIntervalMs: 0 });
    for (let i = 0; i < 5; i++) cache.set(`k${i}`, makeResult(`k${i}`));
    // TTL 절반 시점 hit
    vi.advanceTimersByTime(15);
    expect(cache.get('k0')?.success).toBe(true);
    // TTL 경과 직후 +1ms
    vi.advanceTimersByTime(16); // 총 31ms
    // 순차 조회로 만료 감지 -> ttlEvictions 증가
    let misses = 0;
    for (let i = 0; i < 5; i++) if (!cache.get(`k${i}`)) misses++;
    expect(misses).toBeGreaterThanOrEqual(1);
    const m = cache.getMetrics();
    expect(m.ttlEvictions).toBeGreaterThanOrEqual(1);
    expect(m.purgeIntervalActive).toBe(false);
    vi.useRealTimers();
  });
});
