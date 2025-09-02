// @vitest-environment jsdom
/*
 * RED: 성공 결과 캐시 메트릭 - 두 번째 추출 후 successResultCacheHits 증가해야 함
 */
/* global document */
import { describe, it, expect, beforeEach } from 'vitest';
import { MediaExtractionOrchestrator } from '@/shared/services/media-extraction/MediaExtractionOrchestrator';

function createSuccessStrategy(counter) {
  return {
    name: 'success-strategy',
    priority: 1,
    canHandle: () => true,
    async extract() {
      counter.count++;
      return {
        success: true,
        mediaItems: [],
        clickedIndex: 0,
        metadata: { sourceType: 'success-strategy', strategy: 'success-strategy' },
        tweetInfo: null,
        errors: [],
      };
    },
  };
}

describe('RED: MediaExtractionOrchestrator 성공 결과 캐시 메트릭', () => {
  let orchestrator;
  let counter;
  let element;

  beforeEach(() => {
    document.body.innerHTML = '';
    orchestrator = new MediaExtractionOrchestrator();
    counter = { count: 0 };
    orchestrator.addStrategy(createSuccessStrategy(counter));
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  it('두 번째 추출 후 successResultCacheHits 가 1이 되어야 한다', async () => {
    const first = await orchestrator.extract(element, {});
    expect(first.success).toBe(true);
    expect(counter.count).toBe(1);

    const second = await orchestrator.extract(element, {});
    expect(second.success).toBe(true);

    const metrics = orchestrator.getMetrics();
    // RED: 아직 successResultCacheHits 메트릭 존재/증가 안함
    expect(metrics.successResultCacheHits).toBe(1);
  });
});
