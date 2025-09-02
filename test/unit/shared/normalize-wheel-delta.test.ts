import { describe, it, expect } from 'vitest';
import {
  normalizeWheelDelta,
  WHEEL_DELTA_MAX,
  WHEEL_DELTA_MIN_THRESHOLD,
} from '@/shared/utils/scroll/wheel-normalize';

describe('normalizeWheelDelta', () => {
  it('clamps large positive', () => {
    expect(normalizeWheelDelta(1000)).toBe(240);
  });
  it('clamps large negative preserving sign', () => {
    expect(normalizeWheelDelta(-999)).toBe(-240);
  });
  it('passes through mid value (int trunc)', () => {
    expect(normalizeWheelDelta(180.9)).toBe(180);
  });
  it('filters tiny noise (<1)', () => {
    expect(normalizeWheelDelta(0.5)).toBe(0);
  });
  it('handles NaN', () => {
    expect(normalizeWheelDelta(Number.NaN as unknown as number)).toBe(0);
  });
  it('handles Infinity', () => {
    expect(normalizeWheelDelta(Number.POSITIVE_INFINITY)).toBe(WHEEL_DELTA_MAX);
  });
  it('exports thresholds', () => {
    expect(WHEEL_DELTA_MAX).toBe(240);
    expect(WHEEL_DELTA_MIN_THRESHOLD).toBe(1);
  });
});
