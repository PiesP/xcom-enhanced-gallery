import { describe, it, expect } from 'vitest';
import { evaluateModalSurfaceModeDetailed } from '@/shared/styles/modal-surface-evaluator';

/*
Performance micro-bench for Phase21 evaluator + ladder.
Goal: average execution time per call stays below 5ms (loose upper bound for CI variance; typical <1ms locally).
We avoid flaky assertions by measuring aggregate duration and computing mean.
*/

describe('perf: modal surface evaluator micro-bench', () => {
  it('runs 1000 evaluations under budget', () => {
    const iterations = 1000;
    const colorsBase = [
      '#111111',
      '#222222',
      '#2a2a2a',
      '#333333',
      '#3a3a3a',
      '#444444',
      '#4a4a4a',
      '#555555',
      '#5a5a5a',
      '#666666',
      '#6a6a6a',
      '#777777',
    ];
    const start = performance.now();
    let hash = 0; // prevent V8 from optimizing away
    for (let i = 0; i < iterations; i++) {
      const shift = i % colorsBase.length;
      const sample = colorsBase.slice(shift).concat(colorsBase.slice(0, shift));
      const r = evaluateModalSurfaceModeDetailed({ sampleColors: sample, textColor: '#ffffff' });
      if (r.readabilityStage)
        hash ^= r.readabilityStage.length + (r.noiseScore ? Math.round(r.noiseScore * 1000) : 0);
    }
    const total = performance.now() - start;
    const mean = total / iterations;
    // Hard upper bound (ms)
    expect(mean).toBeLessThan(5);
    // Ensure loop not dead-code eliminated
    expect(hash).not.toBe(0);
  });
});
