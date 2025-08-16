/**
 * 🟢 안정화 레거시 -> 고급 메서드 위임 검증
 */
import { describe, it, expect, vi } from 'vitest';
import { timelineStabilizer } from '../../src/shared/scroll/timeline-position-stabilizer';

describe('waitForLayoutStability delegation', () => {
  it('고급 메서드 호출 결과를 반환한다', async () => {
    const anyStabilizer: any = timelineStabilizer;
    const spy = vi.spyOn(anyStabilizer, 'waitForLayoutStabilityAdvanced').mockResolvedValue({
      success: true,
      diagnostics: { framesObserved: 5, stableSequences: 1 },
    });

    const ok = await anyStabilizer.waitForLayoutStability(123);
    expect(ok).toBe(true);
    expect(spy).toHaveBeenCalledWith({ maxWaitMs: 123, intervalMs: 50, requiredStableFrames: 1 });
  });
});
