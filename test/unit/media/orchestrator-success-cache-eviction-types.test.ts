/**
 * RED: successResultCache eviction 타입 메트릭 (TTL vs LRU) 분리 요구사항
 * 요구사항:
 * 1) 캐시 최대 엔트리 수 초과 시 LRU 방식으로 가장 오래된 항목 제거 → metricsSummary.successResultCacheEvictionTypes.lru >= 1
 * 2) TTL 만료가 없을 경우 ttl === 0 유지
 * 3) 기존 successResultCacheEvictions 누계는 계속 증가 (backward compat)
 *
 * 현재 구현: successResultCacheEvictionTypes 필드 부재 → 테스트 실패 (RED)
 */
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MediaExtractionOrchestrator } from '@/shared/services/media-extraction/MediaExtractionOrchestrator';
import { logger } from '@/shared/logging/logger';

function alwaysSuccess(name = 'S') {
  return {
    name,
    priority: 1,
    canHandle: () => true,
    async extract() {
      return {
        success: true,
        mediaItems: [
          {
            id: `media-${name}-${Math.random().toString(16).slice(2)}`,
            url: 'https://example.com/a.jpg',
            type: 'image',
            filename: `${name}.jpg`,
          },
        ],
        clickedIndex: 0,
        metadata: { sourceType: 'eviction-types', strategy: name },
        tweetInfo: null,
        errors: [],
      };
    },
  };
}

describe('RED: successResultCache eviction 타입 메트릭 분리', () => {
  let orch;
  let infoSpy;
  beforeEach(() => {
    orch = new MediaExtractionOrchestrator();
    orch.addStrategy(alwaysSuccess('A'));
    // TTL 미사용 (TTL eviction 발생하지 않아야 함)
    orch.setSuccessCacheTTL(0);
    // 새 max entries (미구현 상태)
    // 구현 후: setSuccessResultCacheMaxEntries(2) 로 3번째 삽입 시 LRU 1회 발생 기대
    if (orch && typeof orch.setSuccessResultCacheMaxEntries === 'function') {
      orch.setSuccessResultCacheMaxEntries(2); // 구현된 경우에만 호출
    }
    infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});
  });
  afterEach(() => {
    infoSpy.mockRestore();
  });

  it('LRU 기반 1회 이상 eviction 발생 시 metricsSummary.successResultCacheEvictionTypes.lru >= 1 & ttl === 0 (RED)', async () => {
    const d =
      globalThis && globalThis.document ? globalThis.document : { createElement: () => ({}) };
    const el1 = d.createElement('div');
    const el2 = d.createElement('div');
    const el3 = d.createElement('div');

    await orch.extract(el1, {}); // cache add 1
    await orch.extract(el2, {}); // cache add 2 (가득참)
    await orch.extract(el3, {}); // cache add 3 → LRU eviction 기대

    const summaryCalls = infoSpy.mock.calls.filter(c => c.some(a => a && a.metricsSummary));
    const lastSummary = summaryCalls.length
      ? summaryCalls[summaryCalls.length - 1].find(a => a && a.metricsSummary)
      : null;
    // RED 기대: 아직 successResultCacheEvictionTypes 필드 없으므로 undefined → 아래 단언 실패
    expect(lastSummary?.metricsSummary?.successResultCacheEvictionTypes).toBeDefined();
    expect(
      lastSummary?.metricsSummary?.successResultCacheEvictionTypes?.lru
    ).toBeGreaterThanOrEqual(1);
    expect(lastSummary?.metricsSummary?.successResultCacheEvictionTypes?.ttl || 0).toBe(0);
  });
});
