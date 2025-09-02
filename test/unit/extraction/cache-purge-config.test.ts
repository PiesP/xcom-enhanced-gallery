// @ts-nocheck
/* eslint-env browser */
/**
 * MediaExtractionCache purgeIntervalMs 옵션 & dispose 테스트
 */
import { describe, it, expect, vi } from 'vitest';
import { MediaExtractionCache } from '@/shared/services/media-extraction/MediaExtractionCache';

function fastResult() {
  return {
    success: true,
    mediaItems: [],
    clickedIndex: 0,
    metadata: { extractedAt: Date.now(), sourceType: 't', strategy: 't' },
    tweetInfo: null,
  };
}

describe('MediaExtractionCache purgeIntervalMs 옵션', () => {
  it('purgeIntervalMs=0 이면 타이머 비활성화 (purgeIntervalActive=false)', () => {
    const cache = new MediaExtractionCache({ ttlMs: 20, purgeIntervalMs: 0 });
    const m = cache.getMetrics();
    expect(m.purgeIntervalActive).toBe(false);
  });

  it('dispose() 호출 시 purgeIntervalActive=false 로 전환', () => {
    const cache = new MediaExtractionCache({ ttlMs: 20, purgeIntervalMs: 30 });
    const before = cache.getMetrics();
    expect(before.purgeIntervalActive).toBe(true);
    cache.dispose();
    const after = cache.getMetrics();
    expect(after.purgeIntervalActive).toBe(false);
  });

  it('주기 purge 없이 수동 purgeStale 로 만료 제거 & purgeCount 증가', () => {
    vi.useFakeTimers();
    const cache = new MediaExtractionCache({ ttlMs: 10, purgeIntervalMs: 0 });
    cache.set('k', fastResult());
    vi.advanceTimersByTime(15); // expire
    const removed = cache.purgeStale('manual');
    expect(removed).toBe(1);
    const m = cache.getMetrics();
    expect(m.purgeCount).toBe(1);
    vi.useRealTimers();
  });

  it('setPurgeInterval 동적 재설정 (start->stop->start) 반영', () => {
    const cache = new MediaExtractionCache({ ttlMs: 100, purgeIntervalMs: 0 });
    expect(cache.getMetrics().purgeIntervalActive).toBe(false);
    cache.setPurgeInterval(20);
    expect(cache.getMetrics().purgeIntervalActive).toBe(true);
    cache.setPurgeInterval(0);
    expect(cache.getMetrics().purgeIntervalActive).toBe(false);
    cache.setPurgeInterval(15);
    expect(cache.getMetrics().purgeIntervalActive).toBe(true);
    cache.dispose();
  });
});
