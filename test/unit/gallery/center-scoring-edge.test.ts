import { describe, it, expect } from 'vitest';
import { resolveBestCenter, computeCenterScore } from '@/features/gallery/utils/center-scoring';

describe('center-scoring util (RED for new edge semantics)', () => {
  it('동점인 경우 낮은 인덱스 선택 (tie-break)', () => {
    const c0 = computeCenterScore({ visibilityRatio: 1, normalizedDistance: 0.2 });
    const c1 = computeCenterScore({ visibilityRatio: 1, normalizedDistance: 0.2 });
    const resolved = resolveBestCenter({
      candidates: [
        { index: 1, score: c1 },
        { index: 0, score: c0 },
      ],
      tieBreak: 'lower-index',
    });
    expect(resolved.index).toBe(0); // 현재 구현도 통과하지만 회귀 방지
  });

  it('가시성이 0인 모든 아이템 → index -1 반환 (향후 개선 기대)', () => {
    const resolved = resolveBestCenter({ candidates: [], tieBreak: 'lower-index' });
    // 현재 useVisibleCenterItem 는 -1 대신 0을 반환 (bestIdx 초기값) → RED
    expect(resolved.index).toBe(-1);
  });
});
