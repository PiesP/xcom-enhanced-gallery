/**
 * Adaptive Readability Guard utilities (initial implementation).
 * Phase 21: noise metrics + ladder stage selection.
 * NOTE: Lightweight – keeps execution <1ms for <=16 samples.
 */
import { parseColor, computeContrastRatio } from './modal-surface-evaluator';

export interface NoiseMetrics {
  luminanceVariance: number; // 0..~
  avgAdjacencyDeltaL: number; // average absolute luminance diff between sequential samples
  noiseScore: number; // 0..1 normalized heuristic
}

function relativeLuminanceFromRGB(r: number, g: number, b: number): number {
  const toLinear = (c: number): number => {
    const cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  };
  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function computeNoiseMetrics(colors: string[]): NoiseMetrics {
  if (!colors || colors.length === 0) {
    return { luminanceVariance: 0, avgAdjacencyDeltaL: 0, noiseScore: 0 };
  }
  const luminances: number[] = [];
  for (const c of colors) {
    try {
      const { r, g, b } = parseColor(c);
      luminances.push(relativeLuminanceFromRGB(r, g, b));
    } catch {
      /* ignore */
    }
  }
  if (luminances.length === 0) {
    return { luminanceVariance: 0, avgAdjacencyDeltaL: 0, noiseScore: 0 };
  }
  const mean = luminances.reduce((a, b) => a + b, 0) / luminances.length;
  const variance = luminances.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / luminances.length;
  let deltaSum = 0;
  for (let i = 1; i < luminances.length; i++) {
    deltaSum += Math.abs(luminances[i] - luminances[i - 1]);
  }
  const avgDelta = luminances.length > 1 ? deltaSum / (luminances.length - 1) : 0;
  // Normalization heuristic: variance (0~0.09 typical) -> clamp & scale
  const normVar = Math.min(variance / 0.09, 1);
  // Adjacency delta (0~0.5 typical) -> scale
  const normAdj = Math.min(avgDelta / 0.5, 1);
  const noiseScore = +(0.6 * normVar + 0.4 * normAdj).toFixed(4);
  return { luminanceVariance: variance, avgAdjacencyDeltaL: avgDelta, noiseScore };
}

export type ReadabilityStage = 'glass' | 'scrim-low' | 'scrim-med' | 'scrim-high' | 'solid';

interface LadderParams {
  minContrast: number; // observed min contrast vs text color
  noiseScore: number; // 0..1
  previousStage?: ReadabilityStage;
  previousNoiseScore?: number; // for hysteresis grace window
  /**
   * targetContrast: Ladder rationale 문서 기준 기본 6 (glass 유지 상한).
   * Dark 모드 내부 튜닝 시 targetDark≈5.3, floorDark≈5.0 적용 가능 (현재 코드에서는 외부 호출자가 조정).
   */
  targetContrast?: number; // default 6
}

export function adaptReadabilityLadder(params: LadderParams): ReadabilityStage {
  const { minContrast, noiseScore, previousStage, previousNoiseScore, targetContrast = 6 } = params;
  // Thresholds (initial calibration – may be tuned in tests):
  // δ (delta) ~= 0.25 (문서 Ladder: target-δ 경계), noise 분류: LOW 0.25 / HIGH 0.55
  const T_LOW = 0.25; // below: quiet (δ 하한 근사)
  const T_HIGH = 0.55; // above: very noisy
  // Immediate solid fallback when both contrast and noise are poor
  if (minContrast < 4.3 && noiseScore >= T_LOW) return 'solid';
  // High noise + low-ish contrast
  if (minContrast < 4.6 && noiseScore >= T_HIGH) return 'solid';
  // If contrast already excellent & noise quiet → glass
  if (minContrast >= targetContrast && noiseScore < T_LOW) return 'glass';
  // Hysteresis: retain previous scrim intensity if noise change small (<0.05) and stage wouldn't improve much
  const hysteresisKeep = (next: ReadabilityStage): boolean => {
    if (!previousStage || !previousNoiseScore) return false;
    if (previousStage === 'solid') return false;
    if (previousStage === next) return true;
    const delta = Math.abs(noiseScore - previousNoiseScore);
    if (delta > 0.05) return false;
    const priority = (s: ReadabilityStage): number =>
      ['glass', 'scrim-low', 'scrim-med', 'scrim-high', 'solid'].indexOf(s);
    // Only keep if new stage is less or equal priority (i.e., would downgrade)
    return priority(next) < priority(previousStage);
  };
  // Escalation ladder
  // Base intensity decision
  if (noiseScore < T_LOW) {
    // Quiet but contrast below target → gentle scrim
    const candidate = minContrast < targetContrast ? 'scrim-low' : 'glass';
    if (hysteresisKeep(candidate)) return previousStage!;
    return candidate;
  }
  if (noiseScore < T_HIGH) {
    // Moderate noise
    if (minContrast < 4.7) {
      if (hysteresisKeep('scrim-high')) return previousStage!;
      return 'scrim-high';
    }
    if (minContrast < targetContrast) {
      if (hysteresisKeep('scrim-med')) return previousStage!;
      return 'scrim-med';
    }
    if (hysteresisKeep('scrim-low')) return previousStage!;
    return 'scrim-low';
  }
  // Very high noise
  if (minContrast < 5.5) {
    if (hysteresisKeep('scrim-high')) return previousStage!;
    return 'scrim-high';
  }
  if (hysteresisKeep('scrim-med')) return previousStage!;
  return 'scrim-med';
}

// Extended version returning trace reasons (Phase 21 escalation trace)
export interface ReadabilityLadderTraceEntry {
  stage: ReadabilityStage;
  reason: string;
  minContrast: number;
  noiseScore: number;
  previousStage?: ReadabilityStage;
}

export function adaptReadabilityLadderWithTrace(params: LadderParams): {
  stage: ReadabilityStage;
  trace: ReadabilityLadderTraceEntry[];
} {
  const trace: ReadabilityLadderTraceEntry[] = [];
  const { minContrast, noiseScore, previousStage, previousNoiseScore, targetContrast = 6 } = params;
  const T_LOW = 0.25;
  const T_HIGH = 0.55;
  const push = (stage: ReadabilityStage, reason: string) => {
    trace.push({ stage, reason, minContrast, noiseScore, previousStage });
    return stage;
  };
  // Early decisive branches
  if (minContrast < 4.3 && noiseScore >= T_LOW)
    return { stage: push('solid', 'contrast<4.3 & noise>=LOW'), trace };
  if (minContrast < 4.6 && noiseScore >= T_HIGH)
    return { stage: push('solid', 'contrast<4.6 & noise>=HIGH'), trace };
  if (minContrast >= targetContrast && noiseScore < T_LOW)
    return { stage: push('glass', 'high contrast & quiet noise'), trace };
  // Hysteresis helper replicate
  const priority = (s: ReadabilityStage): number =>
    ['glass', 'scrim-low', 'scrim-med', 'scrim-high', 'solid'].indexOf(s);
  const hysteresisKeep = (next: ReadabilityStage): boolean => {
    if (!previousStage || !previousNoiseScore) return false;
    if (previousStage === 'solid') return false;
    if (previousStage === next) return true;
    const delta = Math.abs(noiseScore - previousNoiseScore);
    if (delta > 0.05) return false;
    return priority(next) < priority(previousStage);
  };
  // Moderate path branches with trace
  if (noiseScore < T_LOW) {
    const candidate = minContrast < targetContrast ? 'scrim-low' : 'glass';
    if (hysteresisKeep(candidate))
      return { stage: push(previousStage!, 'hysteresis retain (quiet noise)'), trace };
    return { stage: push(candidate, 'quiet noise branch'), trace };
  }
  if (noiseScore < T_HIGH) {
    if (minContrast < 4.7) {
      if (hysteresisKeep('scrim-high'))
        return { stage: push(previousStage!, 'hysteresis retain high scrim'), trace };
      return { stage: push('scrim-high', 'moderate noise + low contrast'), trace };
    }
    if (minContrast < targetContrast) {
      if (hysteresisKeep('scrim-med'))
        return { stage: push(previousStage!, 'hysteresis retain med scrim'), trace };
      return { stage: push('scrim-med', 'moderate noise + mid contrast'), trace };
    }
    if (hysteresisKeep('scrim-low'))
      return { stage: push(previousStage!, 'hysteresis retain low scrim'), trace };
    return { stage: push('scrim-low', 'moderate noise + near target contrast'), trace };
  }
  // Very high noise branch
  if (minContrast < 5.5) {
    if (hysteresisKeep('scrim-high'))
      return { stage: push(previousStage!, 'hysteresis retain very high noise'), trace };
    return { stage: push('scrim-high', 'very high noise + sub 5.5 contrast'), trace };
  }
  if (hysteresisKeep('scrim-med'))
    return { stage: push(previousStage!, 'hysteresis retain med (very high noise)'), trace };
  return { stage: push('scrim-med', 'very high noise fallback'), trace };
}

// (Optional future) helper to estimate blended contrast for alpha escalation – placeholder for later refinement.
export function estimateBlendedContrast(
  textColor: string,
  bgColors: string[],
  overlay: string,
  alpha: number
): number {
  // Simple darkest-case approximation: blend each sample & take min contrast.
  let min = Infinity;
  for (const c of bgColors) {
    try {
      const blended = blendColorOver(c, overlay, alpha);
      const ratio = computeContrastRatio(textColor, blended);
      if (ratio < min) min = ratio;
    } catch {
      /* ignore */
    }
  }
  return min === Infinity ? 0 : min;
}

function blendColorOver(bg: string, overlay: string, alpha: number): string {
  const bgRGB = parseColor(bg);
  const ovRGB = parseColor(overlay);
  const r = Math.round((1 - alpha) * bgRGB.r + alpha * ovRGB.r);
  const g = Math.round((1 - alpha) * bgRGB.g + alpha * ovRGB.g);
  const b = Math.round((1 - alpha) * bgRGB.b + alpha * ovRGB.b);
  return `rgb(${r}, ${g}, ${b})`;
}

// Export types for tests
export type { LadderParams };
