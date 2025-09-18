/**
 * boundary-wheel-guard.red.test.ts
 * RED: shouldConsumeWheelAtBoundary 미구현 상태 (throw) — 경계 판단 스펙 명세
 */
import { describe, it, expect } from 'vitest';
import { shouldConsumeWheelAtBoundary } from '@shared/utils/scroll/boundary-wheel-guard';

function ctx(
  partial: Partial<{
    scrollTop: number;
    scrollHeight: number;
    clientHeight: number;
    deltaY: number;
  }>
) {
  return {
    scrollTop: 500,
    scrollHeight: 2000,
    clientHeight: 300,
    deltaY: 120,
    ...partial,
  };
}

describe('shouldConsumeWheelAtBoundary (RED)', () => {
  it('mid-scroll (여유 있음) -> false 기대', () => {
    // 현재는 throw → 실패해야 함
    expect(shouldConsumeWheelAtBoundary(ctx({}))).toBe(false);
  });
  it('top boundary에서 위로(deltaY<0) -> true 기대', () => {
    expect(shouldConsumeWheelAtBoundary(ctx({ scrollTop: 0, deltaY: -120 }))).toBe(true);
  });
  it('bottom boundary에서 아래(deltaY>0) -> true 기대', () => {
    expect(
      shouldConsumeWheelAtBoundary(
        ctx({ scrollTop: 1700 /* scrollHeight-clientHeight */, deltaY: 120 })
      )
    ).toBe(true);
  });
  it('non-scrollable (scrollHeight <= clientHeight) -> true (소비, 체인 방지)', () => {
    expect(
      shouldConsumeWheelAtBoundary(
        ctx({ scrollHeight: 200, clientHeight: 300, scrollTop: 0, deltaY: 50 })
      )
    ).toBe(true);
  });
});
