/**
 * @fileoverview Focus scoring helpers
 * @description Provides normalized scoring for gallery auto-focus candidates.
 *
 * The scoring model blends multiple heuristics learned from scrollspy-focused
 * IntersectionObserver implementations in the community (see
 * https://blog.maximeheckel.com/posts/scrollspy-demystified/ and
 * https://yashmahalwal.medium.com/scrollspy-using-intersection-observer-36acb7520e46)
 * and MDN's recommended practices around intersection ratios.
 */

import { clamp01 } from '@shared/utils/types/safety';

export interface FocusScoreInput {
  /** Candidate index */
  index: number;
  /** Fraction of the viewport height covered by the candidate (0-1) */
  viewportCoverage: number;
  /** Fraction of the element that is currently visible (0-1) */
  elementVisibility: number;
  /** Proximity of the visible center to viewport center (0-1) */
  centerProximity: number;
  /** Overlap ratio with the focus band (0-1) */
  focusBandCoverage: number;
  /** Whether the element straddles the viewport center line */
  intersectsCenterLine: boolean;
}

export interface FocusScoreWeights {
  coverage: number;
  elementVisibility: number;
  centerProximity: number;
  focusBand: number;
  centerAnchorBonus: number;
}

export interface FocusScoreResult {
  index: number;
  score: number;
  metrics: {
    coverage: number;
    elementVisibility: number;
    centerProximity: number;
    focusBand: number;
    anchorBonus: number;
  };
}

export const DEFAULT_FOCUS_SCORE_WEIGHTS: FocusScoreWeights = {
  coverage: 0.35,
  elementVisibility: 0.2,
  centerProximity: 0.25,
  focusBand: 0.15,
  centerAnchorBonus: 0.05,
};

/**
 * Score a candidate using weighted heuristics.
 */
export function scoreFocusCandidate(
  input: FocusScoreInput,
  weights: FocusScoreWeights = DEFAULT_FOCUS_SCORE_WEIGHTS,
): FocusScoreResult {
  const coverage = clamp01(input.viewportCoverage) * weights.coverage;
  const elementVisibility = clamp01(input.elementVisibility) * weights.elementVisibility;
  const centerProximity = clamp01(input.centerProximity) * weights.centerProximity;
  const focusBand = clamp01(input.focusBandCoverage) * weights.focusBand;
  const anchorBonus = input.intersectsCenterLine ? weights.centerAnchorBonus : 0;

  const score = clamp01(coverage + elementVisibility + centerProximity + focusBand + anchorBonus);

  return {
    index: input.index,
    score,
    metrics: {
      coverage,
      elementVisibility,
      centerProximity,
      focusBand,
      anchorBonus,
    },
  };
}
