/**
 * Phase 2 RED: calcWindowRange 단위 테스트 (기대 범위 계산)
 * 현재 스켈레톤은 모든 아이템을 반환하므로 일부 케이스에서 실패를 유도
 */
import { describe, it, expect } from 'vitest';
import { calcWindowRange } from '@/features/gallery/hooks/useVirtualWindow';

describe('calcWindowRange (Phase 2 GREEN)', () => {
  it('스크롤 상단일 때 적절한 end 범위 계산', () => {
    const range = calcWindowRange(0, 600, {
      total: 1000,
      itemHeightEstimate: 200,
      overscan: 2,
    });
    expect(range.start).toBe(0);
    // 600/200=3 → itemsPerViewport=3, overscan=2 → end = 0 + 3 + 4 = 7
    expect(range.end).toBe(7);
  });

  it('중간 스크롤에서 start/end 이동', () => {
    const range = calcWindowRange(4000, 600, {
      total: 1000,
      itemHeightEstimate: 200,
      overscan: 1,
    });
    // scrollTop/itemHeight=20 → start=19(overscan) → end = 19 + 3 + 2 = 24
    expect(range.start).toBe(19);
    expect(range.end).toBe(24);
  });
});
