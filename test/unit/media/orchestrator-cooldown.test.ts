// @vitest-environment jsdom
/*
 * RED: 클릭 스팸 쿨다운 - 짧은 간격 반복 추출 시 전략 재실행 대신 cooldownApplied 플래그와 캐시 결과 반환
 */
/* global document */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MediaExtractionOrchestrator } from '@/shared/services/media-extraction/MediaExtractionOrchestrator';

function createSuccessStrategy(counter) {
  return {
    name: 'cool-success',
    priority: 1,
    canHandle: () => true,
    async extract() {
      counter.count++;
      return {
        success: true,
        mediaItems: [],
        clickedIndex: 0,
        metadata: { sourceType: 'cool-success', strategy: 'cool-success' },
        tweetInfo: null,
        errors: [],
      };
    },
  };
}

describe('RED: MediaExtractionOrchestrator 클릭 쿨다운', () => {
  let orchestrator;
  let counter;
  let element;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    orchestrator = new MediaExtractionOrchestrator();
    counter = { count: 0 };
    orchestrator.addStrategy(createSuccessStrategy(counter));
    element = document.createElement('section');
    document.body.appendChild(element);
    // @ts-ignore (미구현): 쿨다운 50ms 설정
    orchestrator.setClickCooldown(50);
  });

  it('쿨다운 내 재추출은 전략 미재실행 (counter 증가 X) + metadata.debug.cooldownApplied=true', async () => {
    const first = await orchestrator.extract(element, {});
    expect(first.success).toBe(true);
    expect(counter.count).toBe(1);

    const second = await orchestrator.extract(element, {});
    expect(counter.count).toBe(1); // 캐시/쿨다운으로 증가 없음
    expect(second.metadata?.debug?.cooldownApplied).toBe(true); // RED: 현재 undefined

    // 시간 경과 후 쿨다운 종료
    vi.advanceTimersByTime(60);
    const third = await orchestrator.extract(element, {});
    expect(counter.count).toBe(2); // 쿨다운 끝나 재실행
    expect(third.metadata?.debug?.cooldownApplied).not.toBe(true);
  });
});
