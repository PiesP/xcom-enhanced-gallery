/**
 * scroll-isolation-flag.integration.test.ts
 * FLAG ON 상태에서 boundary guard 적용 경로 기본 계약 검증 (간단 유틸 호출 기반)
 */
import { describe, it, expect } from 'vitest';
import { shouldConsumeWheelAtBoundary } from '@shared/utils/scroll/boundary-wheel-guard';

// 통합 대신: useGalleryScroll 내부 로직은 flag 조건에서 shouldConsumeWheelAtBoundary 결과만 사용하므로
// 여기서는 flag 자체 토글이 없는 순수 함수 결과를 간접적으로 계약화.

function simulate(scrollTop: number, scrollHeight: number, clientHeight: number, deltaY: number) {
  return shouldConsumeWheelAtBoundary({ scrollTop, scrollHeight, clientHeight, deltaY });
}

describe('scroll isolation flag path (boundary contract)', () => {
  it('중간 위치: 소비 안함', () => {
    expect(simulate(300, 2000, 400, 120)).toBe(false);
  });
  it('top boundary 위로 스크롤: 소비', () => {
    expect(simulate(0, 2000, 400, -120)).toBe(true);
  });
  it('bottom boundary 아래로 스크롤: 소비', () => {
    expect(simulate(1600, 2000, 400, 120)).toBe(true);
  });
  it('non-scrollable: 소비', () => {
    expect(simulate(0, 200, 400, 50)).toBe(true);
  });
});
