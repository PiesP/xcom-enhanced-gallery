import { describe, it, expect } from 'vitest';
import {
  escalateTiersUntilContrast,
  type EscalationResult,
  estimateBlendedContrastTier,
  collectBackgroundSamplesV2,
} from '@shared/styles/modal-surface-escalation';

// Phase21.3: Escalation logic (now GREEN)

describe('Phase21.3 modal surface tier escalation', () => {
  it('escalates from glass to at least scrim-med for low contrast bright samples (white text scenario)', () => {
    const samples = ['#f2f2f2', '#ececec', '#fafafa'];
    const result: EscalationResult = escalateTiersUntilContrast({
      samples,
      textColor: '#ffffff',
      threshold: 4.5,
      solidBg: '#111111',
    });
    const order = ['glass', 'scrim-low', 'scrim-med', 'scrim-high', 'solid'];
    expect(order.indexOf(result.finalStage)).toBeGreaterThanOrEqual(order.indexOf('scrim-med'));
    expect(result.blendedContrastFinal).toBeGreaterThanOrEqual(4.5);
  });

  it('escalates all the way to solid when even scrim-high alpha insufficient', () => {
    const samples = ['#ffffff', '#ffffff'];
    const result = escalateTiersUntilContrast({
      samples,
      textColor: '#ffffff',
      threshold: 4.5,
      solidBg: '#111111',
    });
    expect(result.finalStage).toBe('solid');
    expect(result.blendedContrastFinal).toBeGreaterThanOrEqual(4.5);
  });

  it('fail-safe: empty samples -> solid', () => {
    const result = escalateTiersUntilContrast({
      samples: [],
      textColor: '#000000',
      threshold: 4.5,
      solidBg: '#ffffff',
    });
    expect(result.finalStage).toBe('solid');
  });
});

describe('Phase21.3 hysteresis one-step downgrade', () => {
  it('downgrades at most one level when contrast improves sharply', () => {
    const prev = 'scrim-high' as const;
    const samples = ['#d0d0d0', '#d8d8d8'];
    const r = escalateTiersUntilContrast({
      samples,
      textColor: '#ffffff',
      threshold: 4.5,
      solidBg: '#111111',
      previousStage: prev,
    });
    expect(['scrim-med', 'scrim-high']).toContain(r.finalStage);
  });
});

describe('Phase21.3 blended contrast estimator sanity', () => {
  it('returns higher contrast for higher alpha (dark overlay over light backgrounds with white text)', () => {
    const samples = ['#f0f0f0'];
    const low = estimateBlendedContrastTier({
      samples,
      textColor: '#ffffff',
      alpha: 0.22,
      overlayColor: '#000000',
    });
    const high = estimateBlendedContrastTier({
      samples,
      textColor: '#ffffff',
      alpha: 0.46,
      overlayColor: '#000000',
    });
    expect(high).toBeGreaterThan(low);
  });
});

describe('Phase21.3 collectBackgroundSamplesV2 behavior', () => {
  it('returns deterministic array (<=16) even without DOM (jsdom fallback)', () => {
    const s = collectBackgroundSamplesV2();
    expect(Array.isArray(s)).toBe(true);
    expect(s.length).toBeLessThanOrEqual(16);
  });
});
