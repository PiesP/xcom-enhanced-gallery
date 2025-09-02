// @vitest-environment node
/* eslint-env node */
/**
 * MediaExtractionCache 자동 purgeInterval 동작 검증
 * 목적: purgeIntervalMs 설정 시 TTL 경과 후 백그라운드 interval 스캔으로
 *       만료 항목이 제거되고 purgeCount / ttlEvictions 메트릭이 증가하는지 확인.
 *
 * 기존 test(`cache-purge-config.test.ts`)는 수동 purgeStale 및 setPurgeInterval(start/stop)
 * 동작만 다루고 있어 자동 interval 실행 후 만료 제거 경로를 직접 검증하지 않았음.
 */
// @ts-check
import { describe, it, expect, vi } from 'vitest';
import { MediaExtractionCache } from '@/shared/services/media-extraction/MediaExtractionCache';

/**
 * @param {string} id
 * @returns {import('@/shared/types/media.types').MediaExtractionResult}
 */
function result(id) {
  /** @type {import('@/shared/types/media.types').MediaInfo} */
  const media = /** @type {const} */ {
    id: `${id}-0`,
    url: `https://pbs.twimg.com/media/${id}.jpg`,
    type: 'image',
    filename: `${id}.jpg`,
  };
  return {
    success: true,
    mediaItems: [media],
    clickedIndex: 0,
    metadata: { extractedAt: Date.now(), sourceType: 'api-first', strategy: 't' },
    tweetInfo: {
      tweetId: id,
      username: 'u',
      tweetUrl: '',
      extractionMethod: 'mock',
      confidence: 1,
    },
  };
}

describe('MediaExtractionCache 자동 purgeInterval (주기적 만료 스캔)', () => {
  it('purgeIntervalMs 동작으로 TTL 경과 항목이 자동 제거되고 purgeCount/ttlEvictions 증가', () => {
    vi.useFakeTimers();
    const ttlMs = 25;
    const intervalMs = 15; // TTL 이전/이후 두 번 이상 실행되도록 설정
    const cache = new MediaExtractionCache({ ttlMs, purgeIntervalMs: intervalMs, maxEntries: 10 });

    // 테스트 단순화를 위해 타입 강제 캐스팅 (실제 구현 경로에서는 정규 MediaExtractionResult 사용)
    const rA = result('tweetA');
    // @ts-ignore - 테스트 전용 느슨한 객체 허용
    cache.set('tweetA', rA);
    const before = cache.getMetrics();
    expect(before.size).toBe(1);
    expect(before.purgeIntervalActive).toBe(true);
    expect(before.purgeCount).toBe(0);
    expect(before.ttlEvictions).toBe(0);

    // 시간 진행: interval 2회 이상 + TTL 경과
    // 첫 interval 실행(15ms) 시점엔 아직 TTL 미도달 → 제거 없음
    vi.advanceTimersByTime(intervalMs);
    const mid = cache.getMetrics();
    expect(mid.size).toBe(1); // 아직 유지
    expect(mid.purgeCount).toBe(0);
    expect(mid.ttlEvictions).toBe(0);

    // 추가 15ms 진행 -> 총 30ms > ttlMs(25) → 두 번째 interval 콜백에서 만료 제거
    vi.advanceTimersByTime(intervalMs);

    const after = cache.getMetrics();
    // 자동 purge 로 제거되어 size 감소
    expect(after.size).toBe(0);
    // ttlEvictions 는 최소 1 증가
    expect(after.ttlEvictions).toBeGreaterThanOrEqual(1);
    // purgeCount 는 제거된 만료 항목 수(== ttlEvictions 증가분) 이상
    expect(after.purgeCount).toBeGreaterThanOrEqual(1);

    cache.dispose();
    vi.useRealTimers();
  });
});
