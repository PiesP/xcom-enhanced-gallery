import { describe, it, expect } from 'vitest';

/**
 * RED: Background image heuristic tie-break (Phase heuristic v3.1 refinement)
 * 목표: 동일 qualityRank, 동일 inferredPixels 일 때 결정론적 우선 규칙:
 *  1) DPR 가중(2x/3x) 적용된 URL 우선
 *  2) 없으면 index 안정성 (기존 로직)
 * 현재 FallbackStrategy 의 selectBestBackgroundImageUrl 은 DPR 고려 없음 → 실패 기대
 */

// 간단히 내부 로직을 직접 호출하기 위해 FallbackStrategy 인스턴스 생성
import { FallbackStrategy } from '@shared/services/media-extraction/strategies/fallback/FallbackStrategy';

// private 메소드 접근을 우회하기 위해 any 캐스팅 (테스트 한정)

describe('Phase Heuristic: background image tie-break DPR 우선 (RED)', () => {
  it('동일 rank/pixels 에서 @2x 가 없는 이미지보다 @2x 이미지를 선택해야 한다', () => {
    const strat: any = new FallbackStrategy();
    const base = 'https://pbs.twimg.com/media/IMG_1200x800';
    const urls = [
      `${base}?name=large`, // index 0
      `${base}@2x?name=large`, // index 1 (DPR 힌트) 기대 선택
      `${base}?name=large&v=2`, // index 2
    ];

    const cssBg = urls.map(u => `url("${u}")`).join(', ');
    const result = strat.selectBestBackgroundImageUrl(cssBg);
    // 기대: 현재 구현은 DPR 반영 안 하므로 index 0 또는 1 중 결정 → 안정성상 index 0 가능, 따라서 실패 유도
    expect(result?.url).toBe(urls[1]);
  });
});
