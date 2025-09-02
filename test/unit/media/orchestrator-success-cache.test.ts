// @vitest-environment jsdom
/*
 * RED: 성공 결과 캐시 - 동일 요소 두 번째 추출 시 전략 재실행 없이 캐시된 성공 결과 반환
 * Plan 11.B Success Cache 테스트 1
 */
/* global document */
import { describe, it, expect, beforeEach } from 'vitest';
import { MediaExtractionOrchestrator } from '@/shared/services/media-extraction/MediaExtractionOrchestrator';

// 간단 성공 전략 mock
function createSuccessStrategy(callCounter) {
  return {
    name: 'success-strategy',
    priority: 1,
    canHandle: () => true,
    async extract() {
      callCounter.count++;
      return {
        success: true,
        mediaItems: [
          {
            url: 'https://pbs.twimg.com/media/success.jpg',
            type: 'image',
            width: 100,
            height: 100,
            contentType: 'image/jpeg',
          },
        ],
        clickedIndex: 0,
        metadata: {
          sourceType: 'success-strategy',
          strategy: 'success-strategy',
        },
        tweetInfo: null,
        errors: [],
      };
    },
  };
}

describe('RED: MediaExtractionOrchestrator 성공 결과 캐시', () => {
  let orchestrator;
  let counter;
  let element;

  beforeEach(() => {
    document.body.innerHTML = '';
    orchestrator = new MediaExtractionOrchestrator();
    counter = { count: 0 };
    orchestrator.addStrategy(createSuccessStrategy(counter));
    element = document.createElement('img');
    element.setAttribute('src', 'https://pbs.twimg.com/media/success.jpg');
    document.body.appendChild(element);
  });

  it('동일 요소 두 번째 추출 시 전략 extract 재호출 없이 캐시 히트 메타데이터(cacheHit=true) 포함해야 한다', async () => {
    const first = await orchestrator.extract(element, {});
    expect(first.success).toBe(true);
    expect(counter.count).toBe(1);

    const second = await orchestrator.extract(element, {});
    // 기대: 두 번째 호출은 캐시 사용 → 전략 extract 호출 수 증가하지 않음
    expect(counter.count).toBe(1); // RED: 현재는 2가 될 것
    expect(second.success).toBe(true);
    // 기대: 메타데이터 debug.cacheHit 플래그 존재
    expect(second.metadata?.debug?.cacheHit).toBe(true);
  });
});
