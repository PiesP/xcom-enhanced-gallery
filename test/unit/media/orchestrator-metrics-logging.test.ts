// @vitest-environment jsdom
/* global document */
/*
 * RED: Orchestrator 추출 성공 시 logger.info 단일 라인 요약 로그 출력
 * 포맷 포함 필드: success, sessionId, cacheHit, cooldownApplied(optional), strategiesTried, successResultCacheHits 누적
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MediaExtractionOrchestrator } from '@/shared/services/media-extraction/MediaExtractionOrchestrator';
import { logger } from '@/shared/logging/logger';

/**
 * @param {{c:number}} counter
 */
function createAlwaysSuccess(counter) {
  return {
    name: 'log-success',
    priority: 1,
    canHandle: () => true,
    async extract() {
      counter.c++;
      return {
        success: true,
        mediaItems: [],
        clickedIndex: 0,
        metadata: { sourceType: 'log-success', strategy: 'log-success' },
        tweetInfo: null,
        errors: [],
      };
    },
  };
}

describe('RED: MediaExtractionOrchestrator metrics logging', () => {
  let orchestrator;
  let counter;
  let element;
  let infoSpy;

  beforeEach(() => {
    document.body.innerHTML = '';
    counter = { c: 0 };
    orchestrator = new MediaExtractionOrchestrator();
    orchestrator.addStrategy(createAlwaysSuccess(counter));
    element = document.createElement('div');
    document.body.appendChild(element);
    infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});
  });

  it('성공 시 단일 info 로그 라인에 핵심 메트릭 포함', async () => {
    const result = await orchestrator.extract(element, {});
    expect(result.success).toBe(true);
    // 기대: infoSpy 가 최소 1회 호출되고 첫 호출 args 문자열/객체 중 하나에 metricsSummary 필드 포함 (현재 미구현 → RED)
    const hasMetrics = infoSpy.mock.calls.some(call =>
      call.some(
        arg =>
          typeof arg === 'object' &&
          arg &&
          Object.prototype.hasOwnProperty.call(arg, 'metricsSummary')
      )
    );
    expect(hasMetrics).toBe(true); // RED: 현재 false 예상
  });
});
