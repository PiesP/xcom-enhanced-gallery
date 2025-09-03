/**
 * Modal Surface Scrim Evaluation (Phase21)
 * Lightweight variance + contrast heuristic to decide scrim overlay intensity.
 */
import { parseColor } from './modal-surface-evaluator';

export interface ScrimEvaluation {
  enabled: boolean;
  intensity: 'low' | 'med' | 'high';
  variance: number; // standard deviation of rgb channels across samples
}

// Estimate chroma variance: compute per-channel stddev then average.
export function estimateChromaVariance(colors: string[]): number {
  if (!colors || colors.length === 0) return 0;
  const rgbs = colors
    .map(c => {
      try {
        return parseColor(c);
      } catch {
        return null;
      }
    })
    .filter((v): v is { r: number; g: number; b: number } => !!v);
  if (rgbs.length === 0) return 0;
  const rs = rgbs.map(c => c.r);
  const gs = rgbs.map(c => c.g);
  const bs = rgbs.map(c => c.b);
  const std = (arr: number[]): number => {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
  };
  const rStd = std(rs);
  const gStd = std(gs);
  const bStd = std(bs);
  return (rStd + gStd + bStd) / 3;
}

// Map variance + contrast to scrim intensity.
export function deriveScrimIntensity(
  variance: number,
  minContrast: number
): 'low' | 'med' | 'high' {
  // Heuristic thresholds (empirical):
  // - variance < 10: background fairly uniform -> maybe low or none
  // - variance 10~35: moderate complexity -> med if contrast borderline
  // - variance > 35: high complexity -> high
  // Adjust by contrast: if contrast <5.2 borderline -> bump one level
  if (variance <= 0) return 'low';
  let level: 'low' | 'med' | 'high';
  if (variance < 12) level = 'low';
  else if (variance < 38) level = 'med';
  else level = 'high';
  if (minContrast < 5.2) {
    if (level === 'low') level = 'med';
    else if (level === 'med') level = 'high';
  }
  return level;
}

export function evaluateScrim(sampleColors: string[], minContrast: number): ScrimEvaluation {
  if (!sampleColors || sampleColors.length === 0) {
    return { enabled: false, intensity: 'low', variance: 0 };
  }
  // Quick early exit: if contrast very high no need
  if (minContrast >= 7) {
    return { enabled: false, intensity: 'low', variance: 0 };
  }
  const variance = estimateChromaVariance(sampleColors);
  // Enable if either variance moderate+ or contrast borderline (4.5~6)
  const enable = variance > 8 || (minContrast >= 4.5 && minContrast < 6.2);
  if (!enable) return { enabled: false, intensity: 'low', variance };
  const intensity = deriveScrimIntensity(variance, minContrast);
  return { enabled: true, intensity, variance };
}
