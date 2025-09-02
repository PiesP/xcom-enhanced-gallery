// @vitest-environment jsdom
// @ts-nocheck
/*
 * SAME-SESSION RETRY: 동일 세션 내 동일 element 재추출 허용 확인
 * Phase 11.B: 세션 경계 도입 전 기본 보장 - duplicate 차단 없이 재시도 가능해야 함
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { MediaExtractionOrchestrator } from '@/shared/services/media-extraction/MediaExtractionOrchestrator';
/* global document */

function buildImg(url) {
  const img = document.createElement('img');
  img.src = url;
  document.body.appendChild(img);
  return img;
}

describe('Same session: MediaExtractionOrchestrator 동일 요소 재시도 허용', () => {
  let orchestrator;
  const URL = 'https://pbs.twimg.com/media/dup_red.jpg';

  beforeEach(() => {
    document.body.innerHTML = '';
    orchestrator = new MediaExtractionOrchestrator();
    // 최소 전략 mock: 항상 실패 → duplicate 태그만 검증
    orchestrator.addStrategy({
      name: 'noop',
      priority: 1,
      canHandle: () => true,
      async extract() {
        return {
          success: false,
          mediaItems: [],
          clickedIndex: 0,
          metadata: { sourceType: 'noop' },
          tweetInfo: null,
          errors: [],
        };
      },
    });
  });

  it('동일 element 두 번째 추출도 duplicate 아님', async () => {
    const img = buildImg(URL);
    const first = await orchestrator.extract(img, {});
    expect(first.metadata?.sourceType).not.toBe('duplicate');

    const second = await orchestrator.extract(img, {});
    expect(second.metadata?.sourceType).not.toBe('duplicate');
  });
});
