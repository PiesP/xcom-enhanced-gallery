/**
 * RED: 성공 결과 캐시 churn / 다중 TTL 만료 메트릭 확장
 * 요구사항:
 * 1) 여러 번 TTL 만료 후 재추출 시 eviction 누적 (>=2)
 * 2) metricsSummary.successResultCacheSize 포함 (현재 미포함)
 * 3) 각 성공 경로 info 로그 중 마지막 호출에 successResultCacheSize 반영
 * 현재 구현: successResultCacheSize 필드 없음 → 테스트 실패해야 함.
 */
// @vitest-environment jsdom
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MediaExtractionOrchestrator } from '@/shared/services/media-extraction/MediaExtractionOrchestrator';
import { logger } from '@/shared/logging/logger';

function alwaysSuccess(name = 'ttl') {
  return {
    name,
    priority: 1,
    canHandle: () => true,
    async extract(): Promise<any> {
      const mediaItems = [
        {
          id: `media-${name}`,
          url: 'https://example.com/a.jpg',
          type: 'image',
          filename: `${name}.jpg`,
        },
      ];
      return {
        success: true,
        mediaItems,
        clickedIndex: 0,
        metadata: { sourceType: 'ttl-churn', strategy: name },
        tweetInfo: null,
        errors: [],
      };
    },
  };
}

describe('RED: 성공 결과 캐시 TTL 다중 만료 / churn 메트릭', () => {
  let orch;
  let el;
  let infoSpy;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-09-02T00:00:00.000Z'));
    orch = new MediaExtractionOrchestrator();
    orch.addStrategy(alwaysSuccess());
    orch.setSuccessCacheTTL(5); // 매우 짧게
    el = document.createElement('div');
    infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.useRealTimers();
    infoSpy.mockRestore();
  });

  it('두 번 TTL 만료 후 eviction >=2 & metricsSummary.successResultCacheSize 존재 (RED)', async () => {
    // 첫 추출 캐시 저장
    await orch.extract(el, {});
    // 첫 만료
    vi.advanceTimersByTime(10);
    await orch.extract(el, {});
    // 두 번째 만료
    vi.advanceTimersByTime(10);
    await orch.extract(el, {});

    // eviction >=2 판정
    const summaryCalls = infoSpy.mock.calls.filter(c => c.some(a => a && a.metricsSummary));
    const lastSummary = summaryCalls.length
      ? summaryCalls[summaryCalls.length - 1].find(a => a && a.metricsSummary)
      : null;
    expect(lastSummary?.metricsSummary?.successResultCacheEvictions).toBeGreaterThanOrEqual(2);
    // RED: successResultCacheSize 필드 현재 없음 -> undefined -> 아래 기대로 실패
    expect(lastSummary?.metricsSummary?.successResultCacheSize).toBeDefined();
  });
});
