/**
 * 🟢 GREEN: waitForLayoutStabilityAdvanced 고급 안정화 옵션 테스트
 */
import { describe, it, expect, vi } from 'vitest';
import { timelineStabilizer } from '../../src/shared/scroll/timeline-position-stabilizer';
const stabilizerAny: any = timelineStabilizer as any;

describe('🟢 waitForLayoutStabilityAdvanced', () => {
  it('requiredStableFrames=2 충족 시 true 및 진단 정보 반환', async () => {
    for (let i = 0; i < 3; i++) {
      const el = document.createElement('article');
      el.setAttribute('data-testid', 'tweet');
      let call = 0;
      (el as any).getBoundingClientRect = vi.fn(() => {
        call++;
        return {
          top: call < 3 ? 100 + call * 5 : 110,
          bottom: 0,
          left: 0,
          right: 0,
          width: 0,
          height: 0,
        } as DOMRect;
      });
      document.body.appendChild(el);
    }

    const result = await stabilizerAny.waitForLayoutStabilityAdvanced({
      maxWaitMs: 300,
      intervalMs: 10,
      requiredStableFrames: 2,
      collectDiagnostics: true,
    });

    expect(result.success).toBe(true);
    expect(result.diagnostics.framesObserved).toBeGreaterThanOrEqual(3);
    expect(result.diagnostics.stableSequences).toBeGreaterThanOrEqual(1);
  });
});
