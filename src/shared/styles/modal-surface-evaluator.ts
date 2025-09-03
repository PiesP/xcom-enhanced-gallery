/**
 * Adaptive SettingsModal Surface Evaluator (Phase21.2)
 * - Lightweight contrast heuristics (single pass, small sample set)
 */
export type ModalSurfaceMode = 'glass' | 'solid';

export interface EvaluateModalSurfaceModeOptions {
  sampleColors: string[]; // Background samples (CSS color strings)
  textColor?: string; // Expected primary text color
  minContrast?: number; // Threshold to switch to solid
  hysteresisLower?: number; // Lower bound to avoid rapid toggling
  previousMode?: ModalSurfaceMode; // Previous chosen mode (for hysteresis)
  solidHoldMargin?: number; // NEW: keep solid if contrast < (minContrast + margin)
  textShadowMargin?: number; // NEW: apply subtle text-shadow if contrast within +margin but using glass
}

export interface EvaluateModalSurfaceModeDetailedResult {
  mode: ModalSurfaceMode;
  minContrastObserved: number | null;
  applyTextShadow: boolean; // Suggest enhanced readability (glass borderline)
  scrim?: {
    enabled: boolean;
    intensity: 'low' | 'med' | 'high' | null;
    variance: number;
  };
  // Adaptive Readability Guard (Phase21 extension)
  noiseScore?: number; // 0..1 heuristic
  readabilityStage?: 'glass' | 'scrim-low' | 'scrim-med' | 'scrim-high' | 'solid';
  readabilityEscalations?: string[]; // debugging / test transparency
}

// sRGB to relative luminance per WCAG 2.1
export function computeRelativeLuminance(color: string): number {
  const { r, g, b } = parseColor(color);
  const toLinear = (c: number): number => {
    const cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  };
  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function computeContrastRatio(fg: string, bg: string): number {
  const L1 = computeRelativeLuminance(fg);
  const L2 = computeRelativeLuminance(bg);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function evaluateModalSurfaceMode(opts: EvaluateModalSurfaceModeOptions): ModalSurfaceMode {
  const {
    sampleColors,
    textColor = '#000000',
    minContrast = 4.5, // Ladder target 기본 (AA). Dark 모드 적용 시 외부에서 5.3 전달 가능.
    hysteresisLower = 4.3, // floor ~4.2 대비 약간 위 (flicker 완충)
    previousMode,
    solidHoldMargin = 0.2, // δ 근사 (target-δ 구간 유지)
  } = opts;
  if (!sampleColors || sampleColors.length === 0) return 'glass';
  // Compute min contrast across samples
  let min = Infinity;
  for (const c of sampleColors) {
    try {
      const ratio = computeContrastRatio(textColor, c);
      if (ratio < min) min = ratio;
    } catch {
      // ignore parse errors
    }
  }
  if (min === Infinity) return 'glass';
  // Hysteresis (original lower-bound)
  if (previousMode === 'solid' && min < minContrast && min > hysteresisLower) {
    return 'solid';
  }
  // Extended hysteresis: keep solid if previous solid and contrast below (minContrast + solidHoldMargin)
  if (previousMode === 'solid' && min >= minContrast && min < minContrast + solidHoldMargin) {
    return 'solid';
  }
  return min < minContrast ? 'solid' : 'glass';
}

// Detailed evaluator (non-breaking): returns extra metadata including text-shadow hint
import { evaluateScrim } from './modal-surface-scrim';
import { computeNoiseMetrics, adaptReadabilityLadderWithTrace } from './modal-surface-readability';

// Cross-session hysteresis persistence (Phase21): store last stage & noise
const READABILITY_STORAGE_KEY = 'xeg-modal-readability-stage-v1';
const READABILITY_STORAGE_TTL_MS = 10 * 60 * 1000; // 10분

interface PersistedReadabilityState {
  stage: EvaluateModalSurfaceModeDetailedResult['readabilityStage'];
  noiseScore: number;
  ts: number;
}

function loadPersistedReadabilityState(): PersistedReadabilityState | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(READABILITY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedReadabilityState;
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.ts !== 'number' || Date.now() - parsed.ts > READABILITY_STORAGE_TTL_MS) {
      return null; // expired
    }
    if (!parsed.stage || typeof parsed.noiseScore !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function persistReadabilityState(state: PersistedReadabilityState): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(READABILITY_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

interface ReadabilityGlobalCache {
  __XEG_PREV_READABILITY_STAGE__?: 'glass' | 'scrim-low' | 'scrim-med' | 'scrim-high' | 'solid';
  __XEG_PREV_READABILITY_NOISE__?: number;
}
export function evaluateModalSurfaceModeDetailed(
  opts: EvaluateModalSurfaceModeOptions
): EvaluateModalSurfaceModeDetailedResult {
  const baseMode = evaluateModalSurfaceMode(opts);
  const { sampleColors, textColor = '#000000', minContrast = 4.5 } = opts;
  const textShadowMargin = typeof opts.textShadowMargin === 'number' ? opts.textShadowMargin : 0.15;
  let min = Infinity;
  for (const c of sampleColors) {
    try {
      const ratio = computeContrastRatio(textColor, c);
      if (ratio < min) min = ratio;
    } catch {
      /* ignore */
    }
  }
  if (min === Infinity) {
    return { mode: baseMode, minContrastObserved: null, applyTextShadow: false };
  }
  const applyTextShadow = (() => {
    if (typeof globalThis !== 'undefined') {
      const g = globalThis as unknown as { __XEG_TEST_FORCE_TEXT_SHADOW__?: boolean };
      if (g.__XEG_TEST_FORCE_TEXT_SHADOW__) return baseMode === 'glass';
    }
    return baseMode === 'glass' && min >= minContrast && min < minContrast + textShadowMargin;
  })();
  // Adaptive Readability Guard integration
  const noise = computeNoiseMetrics(sampleColors);
  const g = (globalThis as unknown as ReadabilityGlobalCache) || {};
  // Load persisted (cross-session) state if available & inject as previous stage (takes precedence over in-memory)
  const persisted = loadPersistedReadabilityState();
  const prevStage = persisted?.stage || g.__XEG_PREV_READABILITY_STAGE__;
  const prevNoise =
    typeof persisted?.noiseScore === 'number'
      ? persisted.noiseScore
      : g.__XEG_PREV_READABILITY_NOISE__;
  // Use trace-enabled ladder for richer debugging
  const ladder = adaptReadabilityLadderWithTrace({
    minContrast: min,
    noiseScore: noise.noiseScore,
    previousStage: prevStage,
    previousNoiseScore: prevNoise,
  });
  const stage = ladder.stage;
  if (typeof globalThis !== 'undefined') {
    (globalThis as ReadabilityGlobalCache).__XEG_PREV_READABILITY_STAGE__ = stage;
    (globalThis as ReadabilityGlobalCache).__XEG_PREV_READABILITY_NOISE__ = noise.noiseScore;
  }
  // Persist only if stage escalated above glass OR hysteresis relevant (retain scrim/solid). Always store noise for delta calc.
  persistReadabilityState({ stage, noiseScore: noise.noiseScore, ts: Date.now() });
  const escalations: string[] = ladder.trace.map(t => `${t.stage}:${t.reason}`);
  let finalMode: ModalSurfaceMode = baseMode;
  let scrim: EvaluateModalSurfaceModeDetailedResult['scrim'] | undefined;
  if (stage === 'solid') {
    finalMode = 'solid';
  } else if (stage.startsWith('scrim')) {
    // Only attempt scrim when glass was originally selected
    if (baseMode === 'glass') {
      const intensityMap: Record<string, 'low' | 'med' | 'high'> = {
        'scrim-low': 'low',
        'scrim-med': 'med',
        'scrim-high': 'high',
      };
      try {
        const evalScrim = evaluateScrim(sampleColors, min);
        // Force enable with mapped intensity (override heuristic if needed)
        const forcedIntensity = intensityMap[stage] || evalScrim.intensity;
        scrim = {
          enabled: true,
          intensity: forcedIntensity,
          variance: evalScrim.variance,
        };
      } catch {
        /* ignore */
      }
    }
  } else {
    finalMode = baseMode;
  }
  return {
    mode: finalMode,
    minContrastObserved: min,
    applyTextShadow,
    scrim,
    noiseScore: noise.noiseScore,
    readabilityStage: stage,
    readabilityEscalations: escalations,
  };
}

interface ParsedColor {
  r: number;
  g: number;
  b: number;
}

export function parseColor(input: string): ParsedColor {
  const s = input.trim().toLowerCase();
  // #rgb or #rrggbb
  if (s.startsWith('#')) {
    if (s.length === 4) {
      const r = parseInt(s[1] + s[1], 16);
      const g = parseInt(s[2] + s[2], 16);
      const b = parseInt(s[3] + s[3], 16);
      return { r, g, b };
    } else if (s.length === 7) {
      const r = parseInt(s.slice(1, 3), 16);
      const g = parseInt(s.slice(3, 5), 16);
      const b = parseInt(s.slice(5, 7), 16);
      return { r, g, b };
    }
  }
  // rgb / rgba
  const rgbMatch = s.match(/^rgba?\(([^)]+)\)$/);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(',').map(p => p.trim());
    const r = clamp255(parseFloat(parts[0]));
    const g = clamp255(parseFloat(parts[1]));
    const b = clamp255(parseFloat(parts[2]));
    return { r, g, b };
  }
  // Named colors minimal fallback
  if (NAMED_COLORS[s]) return NAMED_COLORS[s];
  throw new Error(`Unsupported color: ${input}`);
}

function clamp255(v: number): number {
  if (Number.isNaN(v)) return 0;
  return Math.min(255, Math.max(0, Math.round(v)));
}

// Minimal named colors used in tests / common backgrounds
const NAMED_COLORS: Record<string, ParsedColor> = {
  black: { r: 0, g: 0, b: 0 },
  white: { r: 255, g: 255, b: 255 },
};

// Test hook: gather samples from injected global for deterministic tests
type GlobalTestFlags = {
  __XEG_TEST_MODAL_SURFACE_SAMPLES__?: string[];
  __XEG_TEST_MODAL_SURFACE_FORCE__?: ModalSurfaceMode;
  __XEG_TEST_FORCE_TEXT_SHADOW__?: boolean; // test override
};
export function getTestSampleColors(): string[] | null {
  if (typeof globalThis !== 'undefined') {
    const g = globalThis as unknown as GlobalTestFlags;
    if (g.__XEG_TEST_MODAL_SURFACE_SAMPLES__) return g.__XEG_TEST_MODAL_SURFACE_SAMPLES__;
  }
  return null;
}
export function getTestForcedMode(): ModalSurfaceMode | null {
  if (typeof globalThis !== 'undefined') {
    const g = globalThis as unknown as GlobalTestFlags;
    if (g.__XEG_TEST_MODAL_SURFACE_FORCE__) return g.__XEG_TEST_MODAL_SURFACE_FORCE__;
  }
  return null;
}
