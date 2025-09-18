/**
 * boundary-wheel-guard.test.ts (graduated from .red)
 * shouldConsumeWheelAtBoundary 순수 경계 판정 계약 테스트
 */
import { describe, it, expect } from 'vitest';
import { shouldConsumeWheelAtBoundary } from '@shared/utils/scroll/boundary-wheel-guard';

describe('shouldConsumeWheelAtBoundary', () => {
  const base = { scrollHeight: 2000, clientHeight: 400 };
  it('중간 위치에서 deltaY>0: false', () => {
    expect(shouldConsumeWheelAtBoundary({ ...base, scrollTop: 300, deltaY: 120 })).toBe(false);
  });
  it('top boundary + 위 방향(deltaY<0): true', () => {
    expect(shouldConsumeWheelAtBoundary({ ...base, scrollTop: 0, deltaY: -40 })).toBe(true);
  });
  it('bottom boundary + 아래 방향(deltaY>0): true', () => {
    expect(shouldConsumeWheelAtBoundary({ ...base, scrollTop: 1600, deltaY: 80 })).toBe(true);
  });
  it('non-scrollable(내용이 짧음): true', () => {
    expect(
      shouldConsumeWheelAtBoundary({
        scrollTop: 0,
        scrollHeight: 200,
        clientHeight: 400,
        deltaY: 20,
      })
    ).toBe(true);
  });
});
