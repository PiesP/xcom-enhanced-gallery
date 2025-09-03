// @vitest-environment jsdom
// Phase 11 Regression: Extreme aspect ratio penalty 확인 (가로/세로 극단 비율 URL이 균형잡힌 고해상도보다 밀린다)
import { describe, it, expect } from 'vitest';
import { DOMDirectExtractor } from '@/shared/services/media-extraction/extractors/DOMDirectExtractor';

class TestableExtractor extends DOMDirectExtractor {
  public select(urls: string[]) {
    return (this as any).selectBestBackgroundImageUrl(urls);
  }
}

describe('background-image heuristic extreme aspect ratio regression (GREEN)', () => {
  it('극단적 비율(>3:1, <1:3)에 패널티 적용되어 균형 잡힌 후보가 선택된다', () => {
    const extractor = new TestableExtractor();
    const urls = [
      'https://pbs.twimg.com/media/wide_4800x1400.jpg?format=jpg&name=orig', // ratio ≈3.43:1 penalty
      'https://pbs.twimg.com/media/retina_balanced_2400x1600.jpg?format=jpg&name=orig&dpr=2', // balanced + dpr
      'https://pbs.twimg.com/media/tall_1200x4000.jpg?format=jpg&name=orig', // ratio 1:3.33 penalty
    ];
    const sel = extractor.select(urls);
    expect(sel).toContain('2400x1600');
  });
});
