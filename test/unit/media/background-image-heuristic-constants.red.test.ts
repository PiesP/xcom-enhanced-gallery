// @vitest-environment jsdom
/**
 * RED: 휴리스틱 상수(DPR_WEIGHT 등) 변경 영향 검증 테스트 스캐폴드
 * 목표: 현재 상수 기반 선택 결과를 스냅샷/기대값으로 고정하여
 * 향후 튜닝 시 안전한 RED->GREEN 사이클 수행.
 */
import { describe, it, expect } from 'vitest';
import { DOMDirectExtractor } from '@/shared/services/media-extraction/extractors/DOMDirectExtractor';

// 최소 public 경로: extractMediaFromContainer -> (private)selectBestBackgroundImageUrl
// 를 직접 사용할 수 없어 selectBestBackgroundImageUrl 노출을 위해 서브클래싱
class TestableExtractor extends DOMDirectExtractor {
  public pick(urls: string[]) {
    // @ts-expect-error private 접근 우회 (테스트 한정)
    return this.selectBestBackgroundImageUrl(urls);
  }
}

describe('RED: Heuristic constants projection (background-image DPR & aspect penalties)', () => {
  it('동일 base score 시 더 높은 DPR(2x)이 선택 가중치를 높여 우선 선택됨을 보장', () => {
    const ex = new TestableExtractor();
    const urls = [
      'https://pbs.twimg.com/media/A_800x800.jpg?format=jpg&name=orig',
      'https://pbs.twimg.com/media/A_800x800@2x.jpg?format=jpg&name=orig',
    ];
    const picked = ex.pick(urls);
    // 현재 상수에서 @2x (+DPR_WEIGHT*2) 로 인해 두 번째 URL 선택이 기대 GREEN 값
    expect(picked).toBe(urls[1]);
  });
});
