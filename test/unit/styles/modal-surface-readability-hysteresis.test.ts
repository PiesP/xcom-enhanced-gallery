import { describe, it, expect } from 'vitest';
import { adaptReadabilityLadder } from '@shared/styles/modal-surface-readability';

describe('readability ladder hysteresis', () => {
  it('작은 noise 변화(<=0.05)에서 단계 다운그레이드가 억제되어야 한다', () => {
    const prev = 'scrim-high' as const;
    const first = adaptReadabilityLadder({
      minContrast: 4.8,
      noiseScore: 0.72,
      previousStage: undefined,
    });
    expect(first === 'scrim-high' || first === 'solid').toBe(true);
    // noise 약간 감소 -> 기본 로직이면 scrim-med 가능, hysteresis 로 유지 기대
    const second = adaptReadabilityLadder({
      minContrast: 4.85,
      noiseScore: 0.69,
      previousStage: prev,
      previousNoiseScore: 0.72,
    });
    expect(second).toBe(prev);
  });
});
