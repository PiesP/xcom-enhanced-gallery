/**
 * 🔴 RED: waitForLayoutStabilityAdvanced 고급 안정화 옵션 테스트
 * 요구사항:
 *  - requiredStableFrames=2 이상 설정 시 최소 2 프레임 연속 동일 top 유지 필요
 *  - diagnostics 객체에 framesObserved, stableSequences >= 1 포함
 *  - checkInterval 사용자 지정(intervalMs=10)
 */
import { describe, it, expect, vi } from 'vitest';
import { timelineStabilizer } from '../../src/shared/scroll/timeline-position-stabilizer';
// 아직 구현되지 않을 예상 API (실패 유도)
const stabilizerAny: any = timelineStabilizer as any;

describe('🔴 waitForLayoutStabilityAdvanced', () => {
  it('requiredStableFrames=2 충족 시 true 및 진단 정보 반환', async () => {
    const articles: HTMLElement[] = [];
    for (let i = 0; i < 3; i++) {
      const el = document.createElement('article');
      el.setAttribute('data-testid', 'tweet');
      // getBoundingClientRect 모킹: 첫 두 호출 위치 변화 후 안정
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
      articles.push(el);
    }

    const result = await stabilizerAny.waitForLayoutStabilityAdvanced?.({
      maxWaitMs: 150,
      intervalMs: 10,
      requiredStableFrames: 2,
      collectDiagnostics: true,
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.diagnostics.framesObserved).toBeGreaterThanOrEqual(3); // 변화 + 안정 프레임 포함
    expect(result.diagnostics.stableSequences).toBeGreaterThanOrEqual(1);
  });
});
