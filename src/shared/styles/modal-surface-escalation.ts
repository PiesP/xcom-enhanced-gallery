// Phase21.3 Implementation: Tier escalation & sampling utilities (GREEN)
// - Expanded sampling
// - Blended contrast estimation
// - Tiered escalation with hysteresis (one-step degrade)
// - Fail-safe conditions

import { computeContrastRatio, parseColor } from '@shared/styles/modal-surface-evaluator';

export type ModalSurfaceStage = 'glass' | 'scrim-low' | 'scrim-med' | 'scrim-high' | 'solid';

export interface EscalationResult {
  finalStage: ModalSurfaceStage;
  blendedContrastFinal: number;
  iterations: number;
}

interface EscalateOptions {
  samples: string[]; // collected background samples
  textColor: string; // expected text color (#000 or #fff typical)
  threshold: number; // minimum required contrast (e.g., 4.5)
  solidBg: string; // solid fallback background color
  previousStage?: ModalSurfaceStage; // for hysteresis downgrade smoothing
}

// Tier static definition (ordered)
const TIERS: Array<{ stage: ModalSurfaceStage; alpha: number }> = [
  { stage: 'glass', alpha: 0 },
  { stage: 'scrim-low', alpha: 0.22 },
  { stage: 'scrim-med', alpha: 0.34 },
  { stage: 'scrim-high', alpha: 0.46 },
  { stage: 'solid', alpha: 1 },
];

// Blend one color over another (overlay over sample) with alpha
function blendColor(bg: string, overlay: string, alpha: number): string {
  const b = parseColorSafe(bg);
  const o = parseColorSafe(overlay);
  const r = Math.round((1 - alpha) * b.r + alpha * o.r);
  const g = Math.round((1 - alpha) * b.g + alpha * o.g);
  const l = Math.round((1 - alpha) * b.b + alpha * o.b);
  return `rgb(${r}, ${g}, ${l})`;
}

function parseColorSafe(c: string): { r: number; g: number; b: number } {
  try {
    return parseColor(c);
  } catch {
    return { r: 255, g: 255, b: 255 };
  }
}

// Compute min blended contrast (worst case) for given overlay alpha & overlayColor
export function estimateBlendedContrastTier(opts: {
  samples: string[];
  textColor: string;
  alpha: number;
  overlayColor: string; // typically '#000000'
}): number {
  if (!opts.samples.length) return 0;
  let min = Infinity;
  for (const s of opts.samples) {
    const blended = opts.alpha === 0 ? s : blendColor(s, opts.overlayColor, opts.alpha);
    try {
      const ratio = computeContrastRatio(opts.textColor, blended);
      if (ratio < min) min = ratio;
    } catch {
      /* ignore */
    }
  }
  return min === Infinity ? 0 : +min.toFixed(3);
}

// Priority order for hysteresis comparisons
const PRIORITY: ModalSurfaceStage[] = ['glass', 'scrim-low', 'scrim-med', 'scrim-high', 'solid'];
function stagePriority(s: ModalSurfaceStage): number {
  return PRIORITY.indexOf(s);
}

export function escalateTiersUntilContrast(options: EscalateOptions): EscalationResult {
  const { samples, threshold, textColor, solidBg, previousStage } = options;
  // Fail-safe: empty samples → solid
  if (!samples || samples.length === 0) {
    return { finalStage: 'solid', blendedContrastFinal: threshold, iterations: 0 };
  }
  // Pre-calc overlay color (assume black for scrim). If textColor is black, invert assumption (overlay white) for contrast.
  const useDarkOverlay = textColor.toLowerCase() !== '#000000';
  const overlayColor = useDarkOverlay ? '#000000' : '#ffffff';

  let chosen: EscalationResult | null = null;
  let iterations = 0;
  for (const tier of TIERS) {
    iterations++;
    const blendedContrast =
      tier.stage === 'solid'
        ? computeContrastRatio(textColor, solidBg)
        : estimateBlendedContrastTier({ samples, textColor, alpha: tier.alpha, overlayColor });
    if (blendedContrast >= threshold || tier.stage === 'solid') {
      chosen = { finalStage: tier.stage, blendedContrastFinal: blendedContrast, iterations };
      break;
    }
  }
  if (!chosen) {
    chosen = { finalStage: 'solid', blendedContrastFinal: threshold, iterations };
  }

  // Hysteresis (one-step degrade max): if previous stage exists & new stage priority improves by >1, clamp improvement to one step
  if (previousStage) {
    const prevP = stagePriority(previousStage);
    const newP = stagePriority(chosen.finalStage);
    if (newP < prevP - 1) {
      const clampedP = prevP - 1;
      const clampedStage = PRIORITY[Math.max(0, clampedP)] as ModalSurfaceStage;
      if (clampedStage !== chosen.finalStage) {
        // recompute blended contrast for clamped stage (approx)
        const tier = TIERS.find(t => t.stage === clampedStage)!;
        const blended =
          clampedStage === 'solid'
            ? computeContrastRatio(textColor, solidBg)
            : estimateBlendedContrastTier({ samples, textColor, alpha: tier.alpha, overlayColor });
        chosen = { finalStage: clampedStage, blendedContrastFinal: blended, iterations };
      }
    }
  }
  return chosen;
}

// Expanded sampling: center + horizontal/vertical ring + corners near expected modal region (top center area)
export function collectBackgroundSamplesV2(): string[] {
  // document.elementFromPoint 존재 여부 안전 검사 (타입 단언 피하기 위해 사용자 정의 타입 가드)
  const doc: Document | undefined = typeof document !== 'undefined' ? document : undefined;
  const win: Window | undefined = typeof window !== 'undefined' ? window : undefined;
  const hasElementFromPoint = !!doc && !!win && typeof doc.elementFromPoint === 'function';

  if (!hasElementFromPoint) {
    return ['#ffffff', '#f5f5f5', '#ededed'];
  }
  const w = win!.innerWidth;
  const baseY = 40; // toolbar 아래 영역 가정
  const offsets: Array<[number, number]> = [
    [w / 2, baseY],
    [w / 2 - 120, baseY + 4],
    [w / 2 + 120, baseY + 4],
    [w / 2 - 60, baseY + 32],
    [w / 2 + 60, baseY + 32],
    [w / 2, baseY + 56],
    [w / 2 - 150, baseY + 20],
    [w / 2 + 150, baseY + 20],
    [w / 2 - 90, baseY + 48],
    [w / 2 + 90, baseY + 48],
  ];
  const samples: string[] = [];
  for (const [x, y] of offsets) {
    const el = doc.elementFromPoint(x, y) as HTMLElement | null;
    if (!el) continue;
    const style = win!.getComputedStyle(el);
    const bg = style.backgroundColor;
    if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') continue;
    samples.push(bg);
    if (samples.length >= 16) break;
  }
  if (!samples.length) {
    // fail-safe guess by theme (check dark scheme)
    const prefersDark = win?.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    return prefersDark ? ['#111111', '#181818'] : ['#ffffff', '#f5f5f5'];
  }
  return samples;
}
