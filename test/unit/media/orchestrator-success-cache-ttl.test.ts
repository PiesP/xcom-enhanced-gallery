// @vitest-environment jsdom
/*
 * RED: 성공 결과 캐시 TTL - TTL 경과 후 동일 요소 재추출 시 전략 재실행 (cacheHit 아님)
 */
/* global document */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MediaExtractionOrchestrator } from '@/shared/services/media-extraction/MediaExtractionOrchestrator';

function createSuccessStrategy(counter) {
  return {
    name: 'ttl-success-strategy',
    priority: 1,
    canHandle: () => true,
    async extract() {
      counter.count++;
      return {
        success: true,
        mediaItems: [],
        clickedIndex: 0,
        metadata: { sourceType: 'ttl-success-strategy', strategy: 'ttl-success-strategy' },
        tweetInfo: null,
        errors: [],
      };
    },
  };
}

describe('RED: MediaExtractionOrchestrator 성공 결과 캐시 TTL', () => {
  let orchestrator;
  let counter;
  let element;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    orchestrator = new MediaExtractionOrchestrator();
    counter = { count: 0 };
    orchestrator.addStrategy(createSuccessStrategy(counter));
    element = document.createElement('span');
    document.body.appendChild(element);
    // 기대: setSuccessCacheTTL 메서드로 TTL 설정 가능 (아직 미구현 -> RED)
    // @ts-ignore
    orchestrator.setSuccessCacheTTL(10); // 10ms
  });

  it('TTL 경과 후 두 번째 추출은 캐시 히트가 아니며 전략 재실행되어 counter 증가해야 한다', async () => {
    const first = await orchestrator.extract(element, {});
    expect(first.success).toBe(true);
    expect(counter.count).toBe(1);

    // TTL 이전: 캐시 히트 예상 (현재 구현상 무제한 캐시) → 먼저 한 번 검증
    const second = await orchestrator.extract(element, {});
    expect(counter.count).toBe(1); // 캐시 사용으로 증가 없음 (cacheHit=true)
    expect(second.metadata?.debug?.cacheHit).toBe(true);

    // 시간 진행 > TTL
    vi.advanceTimersByTime(20);

    const third = await orchestrator.extract(element, {});
    // 기대: TTL 만료로 전략 재실행 → counter 2, cacheHit false/undefined
    expect(counter.count).toBe(2);
    expect(third.metadata?.debug?.cacheHit).not.toBe(true);
  });
});
