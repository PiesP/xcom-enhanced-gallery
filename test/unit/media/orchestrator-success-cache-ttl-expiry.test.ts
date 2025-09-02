// @vitest-environment jsdom
/* global document */
/*
 * RED: 성공 결과 캐시 TTL 만료 후 재추출 시
 *  - 기존 캐시 항목이 TTL 만료로 제거(eviction)된다
 *  - 두 번째 성공 경로 metricsSummary 에 successResultCacheEvictions === 1 포함
 *  - 첫 번째 성공 경로에서는 eviction 값 0
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MediaExtractionOrchestrator } from '@/shared/services/media-extraction/MediaExtractionOrchestrator';
import { logger } from '@/shared/logging/logger';

function createAlwaysSuccess() {
  return {
    name: 'ttl-success',
    priority: 1,
    canHandle: () => true,
    async extract() {
      return {
        success: true,
        mediaItems: [{ url: 'https://example.com/img.jpg', type: 'image' }],
        clickedIndex: 0,
        metadata: { sourceType: 'ttl-success', strategy: 'ttl-success' },
        tweetInfo: null,
        errors: [],
      };
    },
  };
}

describe('RED: MediaExtractionOrchestrator 성공 캐시 TTL 만료 / eviction 메트릭', () => {
  let orchestrator; // MediaExtractionOrchestrator
  let element; // HTMLElement
  let infoSpy; // vitest spy

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-09-02T00:00:00.000Z'));
    document.body.innerHTML = '';
    orchestrator = new MediaExtractionOrchestrator();
    orchestrator.addStrategy(createAlwaysSuccess());
    orchestrator.setSuccessCacheTTL(10); // 10ms TTL
    element = document.createElement('div');
    document.body.appendChild(element);
    infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    infoSpy.mockRestore();
  });

  it('TTL 만료 후 재추출 시 metricsSummary.successResultCacheEvictions === 1 (RED)', async () => {
    const first = await orchestrator.extract(element, {});
    expect(first.success).toBe(true);
    // 첫 번째 info 로그 중 metricsSummary 가 eviction 0 인지 (없는 경우도 허용: RED 상태에서는 필드 자체가 없을 수 있음)

    // 2) 시간 경과 > TTL
    vi.advanceTimersByTime(25); // TTL(10ms) 초과

    // 3) 두 번째 추출 -> TTL 만료 경로: 이전 캐시 제거 + 재추출
    const second = await orchestrator.extract(element, {});
    expect(second.success).toBe(true);

    // 4) info 로그들 중 마지막(또는 두 번째) 호출에서 metricsSummary.successResultCacheEvictions === 1 기대
    const evictionMetricFound = infoSpy.mock.calls.some(call =>
      call.some(
        arg =>
          typeof arg === 'object' &&
          arg &&
          Object.prototype.hasOwnProperty.call(arg, 'metricsSummary') &&
          arg.metricsSummary &&
          arg.metricsSummary.successResultCacheEvictions === 1
      )
    );

    // RED 기대: 현재 orchestrator 는 metricsSummary 에 successResultCacheEvictions 포함 안 함 → false 여야 함
    expect(evictionMetricFound).toBe(true); // RED: 현재는 false 로 실패해야 함
  });
});
