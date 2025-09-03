import { describe, it, expect, beforeEach, vi } from 'vitest';
import { evaluateModalSurfaceModeDetailed } from '@/shared/styles/modal-surface-evaluator';
import * as readability from '@/shared/styles/modal-surface-readability';

// Storage key we plan to use in implementation (test RED first; will be defined in code later)
const STORAGE_KEY = 'xeg-modal-readability-stage-v1';
// TTL mirror (implementation may export later) – 10분 (ms)
const TTL_MS = 10 * 60 * 1000;

describe('modal-surface cross-session hysteresis (RED)', () => {
  beforeEach(() => {
    // jsdom 환경 보장 (test/setup.ts) - 안전 접근
    const ls = (globalThis as unknown as { localStorage?: Storage }).localStorage;
    ls?.clear();
    // 글로벌 캐시 초기화 (이전 테스트 오염 방지)
    const g = globalThis as unknown as {
      __XEG_PREV_READABILITY_STAGE__?: string;
      __XEG_PREV_READABILITY_NOISE__?: number;
    };
    delete g.__XEG_PREV_READABILITY_STAGE__;
    delete g.__XEG_PREV_READABILITY_NOISE__;
    vi.restoreAllMocks();
  });

  it('persists previous high scrim stage across a new session to prevent downgrade (expects scrim-high)', () => {
    // Simulate prior session stored stage (what implementation should write)
    const persisted = {
      stage: 'scrim-high',
      noiseScore: 0.4,
      ts: Date.now(),
    };
    (globalThis as unknown as { localStorage?: Storage }).localStorage?.setItem(
      STORAGE_KEY,
      JSON.stringify(persisted)
    );

    // Force current noise slightly different but within hysteresis delta (<0.05) and contrast improved (< targetContrast but >=4.7)
    vi.spyOn(readability, 'computeNoiseMetrics').mockReturnValue({
      luminanceVariance: 0.01,
      avgAdjacencyDeltaL: 0.02,
      noiseScore: 0.42,
    });

    // Sample colors chosen to yield minContrast around ~5 (>=4.7 & <6) → candidate would be scrim-med if no previousStage
    // Colors chosen to yield contrast ~5.x (>=4.7 && <6) → baseline candidate scrim-med
    const colors = ['#cccccc', '#cdcdcd', '#cbcbcb'];
    const detailed = evaluateModalSurfaceModeDetailed({
      sampleColors: colors,
      textColor: '#000000',
    });
    // With persistence we expect retention of scrim-high via hysteresis retain path
    expect(detailed.readabilityStage).toBe('scrim-high');
    expect(detailed.readabilityEscalations?.some(e => e.includes('hysteresis retain'))).toBe(true);
  });

  it('ignores expired persisted stage beyond TTL and allows downgrade (expects scrim-low)', () => {
    // Expired previous stage (older than TTL)
    const expired = {
      stage: 'scrim-high',
      noiseScore: 0.4,
      ts: Date.now() - TTL_MS - 1000,
    };
    (globalThis as unknown as { localStorage?: Storage }).localStorage?.setItem(
      STORAGE_KEY,
      JSON.stringify(expired)
    );

    vi.spyOn(readability, 'computeNoiseMetrics').mockReturnValue({
      luminanceVariance: 0.01,
      avgAdjacencyDeltaL: 0.02,
      noiseScore: 0.42,
    });

    const colors = ['#cccccc', '#cdcdcd', '#cbcbcb'];
    const detailed = evaluateModalSurfaceModeDetailed({
      sampleColors: colors,
      textColor: '#000000',
    });
    // Without valid previous stage should downgrade to scrim-low (candidate)
    expect(detailed.readabilityStage).toBe('scrim-low');
  });
});
