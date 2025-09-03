/**
 * Contrast Utilities (Phase22 extraction)
 * Provides shared helpers to compute minimum contrast across sample colors
 * reducing duplication in evaluator & escalation modules.
 */
import { computeContrastRatio } from './modal-surface-evaluator';

/**
 * Compute the minimum contrast ratio between the given text color and a list of
 * background samples. Returns 0 if samples empty or all invalid.
 */
export function computeMinContrast(samples: string[], textColor: string): number {
  if (!samples || samples.length === 0) return 0;
  let min = Infinity;
  for (const c of samples) {
    try {
      const ratio = computeContrastRatio(textColor, c);
      if (ratio < min) min = ratio;
    } catch {
      /* ignore parse errors */
    }
  }
  return min === Infinity ? 0 : +min.toFixed(3);
}

/**
 * Blend helper for overlay scenarios (kept small to avoid importing heavy code).
 */
export function blendColorFast(
  bg: string,
  overlay: string,
  alpha: number,
  parser: (c: string) => { r: number; g: number; b: number }
): string {
  const b = parser(bg);
  const o = parser(overlay);
  const r = Math.round((1 - alpha) * b.r + alpha * o.r);
  const g = Math.round((1 - alpha) * b.g + alpha * o.g);
  const l = Math.round((1 - alpha) * b.b + alpha * o.b);
  return `rgb(${r}, ${g}, ${l})`;
}
