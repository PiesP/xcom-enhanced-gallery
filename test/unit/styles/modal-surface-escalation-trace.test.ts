import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateModalSurfaceModeDetailed } from '@shared/styles/modal-surface-evaluator';

interface GTest {
  __XEG_TEST_MODAL_SURFACE_SAMPLES__?: string[];
}

/**
 * RED: Escalation trace 아직 미구현 → readabilityEscalations 비어 있거나 상세 이유 누락 기대 실패
 */
describe('[RED] modal surface escalation trace', () => {
  beforeEach(() => {
    delete (globalThis as any).__XEG_TEST_MODAL_SURFACE_SAMPLES__;
  });

  it('고노이즈 + 낮은 대비 → scrim-high/solid 로 escalation 경로와 이유 단계 기록', () => {
    (globalThis as unknown as GTest).__XEG_TEST_MODAL_SURFACE_SAMPLES__ = [
      '#ff0000',
      '#00ff00',
      '#0000ff',
      '#ffff00',
      '#ff00ff',
      '#00ffff',
      '#000000',
      '#ffffff',
    ];
    const result = evaluateModalSurfaceModeDetailed({
      sampleColors: (globalThis as unknown as GTest).__XEG_TEST_MODAL_SURFACE_SAMPLES__!,
      textColor: '#000000',
    });
    expect(result.readabilityStage === 'scrim-high' || result.readabilityStage === 'solid').toBe(
      true
    );
    // 기대: 최소 1개 이상의 escalation trace 레코드 존재 (미구현 시 length=0 → 실패)
    expect(result.readabilityEscalations && result.readabilityEscalations.length).toBeGreaterThan(
      0
    );
    // 첫 레코드는 stage 또는 noise/contrast 판단 사유 문자열 포함
    if (result.readabilityEscalations) {
      expect(result.readabilityEscalations[0]).toMatch(/contrast|noise|scrim|solid/i);
    }
  });
});
