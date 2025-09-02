import { describe, it, expect } from 'vitest';
// RED: 아직 구현되지 않은 normalizeWheelDelta 함수 기대 사양
// 사양:
// - 입력 deltaY (number)
// - 절대값이 MAX(240) 초과 시 부호 유지한 채 240 으로 clamp
// - 절대값이 MIN_THRESHOLD(1) 미만이면 0 반환 (노이즈 제거)
// - NaN/Infinity 방어: NaN → 0, Infinity → MAX 부호 적용
// - 반환은 정수 (Math.trunc)
// - 중간 범위(|delta|<240) 는 그대로 (정수화만)
// 추후 GREEN 단계에서 src/shared/utils/scroll/wheel-normalize.ts 구현 예정

import {
  normalizeWheelDelta,
  WHEEL_DELTA_MAX,
  WHEEL_DELTA_MIN_THRESHOLD,
} from '@/shared/utils/scroll/wheel-normalize';

describe('RED: normalizeWheelDelta spec', () => {
  it('clamps large positive', () => {
    expect(normalizeWheelDelta(1000)).toBe(240); // MAX 기본값 가정
  });
  it('clamps large negative', () => {
    expect(normalizeWheelDelta(-999)).toBe(-240);
  });
  it('passes through mid value', () => {
    expect(normalizeWheelDelta(180)).toBe(180);
  });
  it('filters tiny noise', () => {
    expect(normalizeWheelDelta(0.5)).toBe(0);
  });
  it('preserves sign after clamp', () => {
    expect(Math.sign(normalizeWheelDelta(-4000))).toBe(-1);
  });
  it('handles NaN', () => {
    expect(normalizeWheelDelta(Number.NaN)).toBe(0);
  });
  it('handles Infinity', () => {
    expect(normalizeWheelDelta(Number.POSITIVE_INFINITY)).toBe(WHEEL_DELTA_MAX);
  });
  it('exports thresholds', () => {
    expect(WHEEL_DELTA_MAX).toBe(240);
    expect(WHEEL_DELTA_MIN_THRESHOLD).toBe(1);
  });
});
