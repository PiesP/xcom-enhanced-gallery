import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateModalSurfaceModeDetailed } from '@shared/styles/modal-surface-evaluator';

// RED: 아직 noiseScore / readabilityStage 확장 전이므로 실패 예상

interface XegTestGlobal {
  __XEG_TEST_MODAL_SURFACE_SAMPLES__?: string[];
}

describe('[RED] evaluator readability extension', () => {
  beforeEach(() => {
    delete (globalThis as any).__XEG_TEST_MODAL_SURFACE_SAMPLES__;
  });

  it('고노이즈 샘플에서 scrim 또는 solid 로 escalation 되어야 한다 (readabilityStage 제공)', () => {
    (globalThis as unknown as XegTestGlobal).__XEG_TEST_MODAL_SURFACE_SAMPLES__ = [
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
      sampleColors: (globalThis as unknown as XegTestGlobal).__XEG_TEST_MODAL_SURFACE_SAMPLES__!,
      textColor: '#000000',
    });
    // 기대 필드 (아직 구현 전이므로 undefined → 테스트 실패 예정)
    expect((result as any).noiseScore).toBeGreaterThan(0.2);
    expect(['scrim-low', 'scrim-med', 'scrim-high', 'solid']).toContain(
      (result as any).readabilityStage
    );
  });
});
