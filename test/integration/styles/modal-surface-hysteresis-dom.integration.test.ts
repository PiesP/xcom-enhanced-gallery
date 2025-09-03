import { describe, it, expect, beforeEach, vi } from 'vitest';
import { evaluateModalSurfaceModeDetailed } from '@/shared/styles/modal-surface-evaluator';
import * as readability from '@/shared/styles/modal-surface-readability';

/*
Integration DOM-ish tests (Phase21) for cross-session hysteresis & escalation behavior.
Covers 4 scenarios:
 A. Valid persisted stage retained within TTL (scrim-high retained)
 B. Expired persisted stage ignored (candidate stage used)
 C. Noise increase beyond hysteresis delta (>0.05) triggers escalation override (stage changes even if previous stored)
 D. Previous solid stage is not hysteresis-retained after conditions improve (downgrade allowed)

We reuse actual evaluator + localStorage via JSDOM. No DOM nodes created; focus is persistence + decision logic.
*/

const STORAGE_KEY = 'xeg-modal-readability-stage-v1';
const TTL_MS = 10 * 60 * 1000; // Mirror implementation

interface PersistedState {
  stage: string;
  noiseScore: number;
  ts: number;
}

describe('modal-surface hysteresis integration (Phase21)', () => {
  beforeEach(() => {
    const ls = (globalThis as any).localStorage as Storage | undefined;
    ls?.clear();
    const g = globalThis as any;
    delete g.__XEG_PREV_READABILITY_STAGE__;
    delete g.__XEG_PREV_READABILITY_NOISE__;
    vi.restoreAllMocks();
  });

  it('A. retains scrim-high within TTL (hysteresis retain trace)', () => {
    const persisted: PersistedState = { stage: 'scrim-high', noiseScore: 0.4, ts: Date.now() };
    (globalThis as any).localStorage?.setItem(STORAGE_KEY, JSON.stringify(persisted));
    vi.spyOn(readability, 'computeNoiseMetrics').mockReturnValue({
      luminanceVariance: 0.01,
      avgAdjacencyDeltaL: 0.02,
      noiseScore: 0.42, // delta 0.02 < 0.05 hysteresis window
    });
    const colors = ['#cccccc', '#cdcdcd', '#cbcbcb'];
    const res = evaluateModalSurfaceModeDetailed({ sampleColors: colors, textColor: '#000000' });
    expect(res.readabilityStage).toBe('scrim-high');
    expect(res.readabilityEscalations?.some(r => r.includes('hysteresis retain'))).toBe(true);
  });

  it('B. ignores expired persisted stage (downgrades to candidate scrim-low)', () => {
    const expired: PersistedState = {
      stage: 'scrim-high',
      noiseScore: 0.4,
      ts: Date.now() - TTL_MS - 500,
    };
    (globalThis as any).localStorage?.setItem(STORAGE_KEY, JSON.stringify(expired));
    vi.spyOn(readability, 'computeNoiseMetrics').mockReturnValue({
      luminanceVariance: 0.01,
      avgAdjacencyDeltaL: 0.02,
      noiseScore: 0.42,
    });
    const colors = ['#cccccc', '#cdcdcd', '#cbcbcb'];
    const res = evaluateModalSurfaceModeDetailed({ sampleColors: colors, textColor: '#000000' });
    expect(res.readabilityStage).toBe('scrim-low');
  });

  it('C. large noise increase disables hysteresis retain (force escalation path)', () => {
    // Store previous scrim-med so that a higher needed stage (scrim-high) will appear without hysteresis retain
    const persisted: PersistedState = { stage: 'scrim-med', noiseScore: 0.2, ts: Date.now() };
    (globalThis as any).localStorage?.setItem(STORAGE_KEY, JSON.stringify(persisted));
    // New noise jumps by >0.05 (0.20 -> 0.36) exceeding hysteresis delta → should not retain previous scrim-med.
    vi.spyOn(readability, 'computeNoiseMetrics').mockReturnValue({
      luminanceVariance: 0.025,
      avgAdjacencyDeltaL: 0.06,
      noiseScore: 0.36,
    });
    // Darker colors to reduce contrast (<4.7) steering ladder toward scrim-high
    const colors = ['#555555', '#575757', '#545454'];
    const res = evaluateModalSurfaceModeDetailed({ sampleColors: colors, textColor: '#000000' });
    // Expect escalation (not retain). Previous was scrim-med; new stage should have >= priority index.
    expect(['scrim-high', 'solid']).toContain(res.readabilityStage);
    expect(res.readabilityEscalations?.some(r => r.includes('retain'))).toBe(false);
  });

  it('D. previous solid not retained once conditions improve (downgrade permitted)', () => {
    const persisted: PersistedState = { stage: 'solid', noiseScore: 0.5, ts: Date.now() };
    (globalThis as any).localStorage?.setItem(STORAGE_KEY, JSON.stringify(persisted));
    // Improved noise & decent contrast (candidate should be scrim-low)
    vi.spyOn(readability, 'computeNoiseMetrics').mockReturnValue({
      luminanceVariance: 0.005,
      avgAdjacencyDeltaL: 0.01,
      noiseScore: 0.24, // quiet (<0.25)
    });
    const colors = ['#d0d0d0', '#d1d1d1', '#cfcfcf'];
    const res = evaluateModalSurfaceModeDetailed({ sampleColors: colors, textColor: '#000000' });
    expect(res.readabilityStage === 'solid').toBe(false);
    expect(['glass', 'scrim-low']).toContain(res.readabilityStage);
  });
});
