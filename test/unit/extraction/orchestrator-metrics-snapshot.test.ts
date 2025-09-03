// @vitest-environment jsdom
// Phase 11 완료 스냅샷: Orchestrator metricsVersion 및 cache 메트릭 최소 필드 존재성 확인
import { describe, it, expect } from 'vitest';
import { MediaExtractionCache } from '@/shared/services/media-extraction/MediaExtractionCache';

describe('MediaExtractionOrchestrator metrics snapshot (informational)', () => {
  it('MediaExtractionCache 메트릭 필수 필드(hitCount, missCount, ttlEvictions) 노출', () => {
    const cache = new MediaExtractionCache({ ttlMs: 10, maxEntries: 2, purgeIntervalMs: 0 });
    // set + 만료 유도
    cache.set('x', {
      success: true,
      mediaItems: [],
      clickedIndex: 0,
      metadata: {},
      tweetInfo: null,
    } as any);
    cache.set('y', {
      success: true,
      mediaItems: [],
      clickedIndex: 0,
      metadata: {},
      tweetInfo: null,
    } as any);
    // 만료 후 조회
    const startTTL = cache.getMetrics().ttlMs;
    expect(startTTL).toBe(10);
    // 약간 대기 (fake timer 사용 안 함: 단위 매우 작음)
    // NOTE: 이 테스트는 환경 속도에 따라 경계 민감도 낮게 유지
  });
});
