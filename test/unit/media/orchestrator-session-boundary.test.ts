// @vitest-environment jsdom
/*
 * RED: 세션 경계 - beginNewSession 호출 후 동일 요소 최초 추출은 cacheHit 아님 + 전략 재실행
 */
/* global document */
import { describe, it, expect, beforeEach } from 'vitest';
import { MediaExtractionOrchestrator } from '@/shared/services/media-extraction/MediaExtractionOrchestrator';

function createSuccessStrategy(counter) {
  return {
    name: 'sess-success',
    priority: 1,
    canHandle: () => true,
    async extract() {
      counter.count++;
      return {
        success: true,
        mediaItems: [],
        clickedIndex: 0,
        metadata: { sourceType: 'sess-success', strategy: 'sess-success' },
        tweetInfo: null,
        errors: [],
      };
    },
  };
}

describe('RED: MediaExtractionOrchestrator 세션 경계', () => {
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

  it('beginNewSession 후 동일 요소 재추출은 캐시 무시되고 전략 재실행 (cacheHit=false)', async () => {
    const first = await orchestrator.extract(element, {});
    expect(first.success).toBe(true);
    expect(counter.count).toBe(1);

    const second = await orchestrator.extract(element, {});
    expect(counter.count).toBe(1); // 성공 캐시 사용 (cacheHit)
    expect(second.metadata?.debug?.cacheHit).toBe(true);

    // 세션 경계 시작 (아직 미구현 → RED: 메서드 없음 혹은 효과 없음)
    // @ts-ignore
    orchestrator.beginNewSession();

    const third = await orchestrator.extract(element, {});
    // 기대: 새로운 세션 → 캐시 무시되어 전략 재호출 → counter 2
    expect(counter.count).toBe(2); // RED: 현재 1 유지될 것
    expect(third.metadata?.debug?.cacheHit).not.toBe(true);
  });
});
