// @vitest-environment jsdom
// Phase 11 v3.1 RED: aspect ratio (가로초과/세로초과 왜곡) + DPR(배수 해상도) 패턴 고려
// 목표: 동일 base 해상도 계열에서 2x (또는 @2x) / apparent area 보정 후 가장 선명한(실제 픽셀 많고 왜곡 적은) URL 선택.
// 현재 구현(selectBestBackgroundImageUrl)은 WxH 면적 + 네이밍 점수만 사용 → 아래 시나리오에서 단순 픽셀 최대(4000x1200) 선택.
// 개선 목표: 극단적 비정상 종횡비(>3:1 또는 <1:3) 에 페널티, 그리고 2x/3x (@2x, 2x, dpr=2) 표기 시 base 해상도*배수 가중.
// 기대 GREEN: 2400x1600(@2x) (표기: 2400x1600?dpr=2) 를 4000x1200(3.33:1) 보다 우선 선택.
// RED: 현재는 4000x1200 선택되어 테스트 실패해야 함 (expect 선택 URL 에 2400x1600 포함).

import { describe, it, expect } from 'vitest';
import { DOMDirectExtractor } from '@/shared/services/media-extraction/extractors/DOMDirectExtractor';

class TestableExtractor extends DOMDirectExtractor {
  // @ts-ignore private 접근 (테스트 한정)
  public select(urls: string[]) {
    return (this as any).selectBestBackgroundImageUrl(urls);
  }
}

describe('background-image heuristic v3.1 (aspect ratio + DPR) (GREEN)', () => {
  it('비정상 종횡비 URL 대신 균형 잡힌 @2x 고해상도 URL을 선택한다', () => {
    const extractor = new TestableExtractor();
    const urls = [
      // 극단적 가로형 (면적 4,800,000) → 가로/세로비 4000/1200 ≈ 3.33 (>3:1) → v3.1 에서 페널티 예정
      'https://pbs.twimg.com/media/xx_banner_4000x1200.jpg?format=jpg&name=origSmall',
      // 균형 잡힌 2:1 (면적 3,200,000) → 중립
      'https://pbs.twimg.com/media/xx_medium_3200x1000.jpg?format=jpg&name=origSmall',
      // @2x 표시 (query dpr=2) 실제 2400x1600 (면적 3,840,000) → 종횡비 1.5:1 & 고해상 선명 (목표 선택)
      'https://pbs.twimg.com/media/xx_retina_2400x1600.jpg?format=jpg&name=origSmall&dpr=2',
      // 세로형 극단 (면적 4,500,000) 1200x3750 ≈ 1:3.125 (<1:3) → v3.1 페널티 예정
      'https://pbs.twimg.com/media/xx_vertical_1200x3750.jpg?format=jpg&name=origSmall',
    ];
    const selected = extractor.select(urls);
    // GREEN: v3.1 적용 후 2400x1600 선택.
    expect(selected).toContain('2400x1600');
  });
});
