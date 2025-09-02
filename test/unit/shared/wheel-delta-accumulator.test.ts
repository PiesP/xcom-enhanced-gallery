import { describe, it, expect } from 'vitest';
import { createWheelDeltaAccumulator } from '@/shared/utils/scroll/wheel-delta-accumulator';

/**
 * Phase 14: WheelDeltaAccumulator 단위 테스트 (RED -> GREEN)
 */

describe('WheelDeltaAccumulator', () => {
  it('소수 delta 누적 후 1px 소비', () => {
    const acc = createWheelDeltaAccumulator();
    expect(acc.push(0.4)).toBe(0);
    expect(acc.push(0.4)).toBe(0);
    const consumed = acc.push(0.4); // 1.2 -> 1 소비
    expect(consumed).toBe(1);
    expect(Math.abs(acc.peekResidual())).toBeLessThan(1);
  });

  it('방향 전환 시 누적 초기화', () => {
    const acc = createWheelDeltaAccumulator();
    acc.push(0.7); // residual 0.7
    acc.push(-0.2); // 방향 전환 => residual reset 후 -0.2
    const consumed = acc.push(-0.9); // -1.1 => -1 소비
    expect(consumed).toBe(-1);
    expect(acc.peekResidual()).toBeGreaterThan(-1);
  });
});
