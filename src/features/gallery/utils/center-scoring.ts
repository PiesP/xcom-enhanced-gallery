/**
 * @fileoverview Scoring utilities for determining the most appropriate center-visible gallery item.
 * Extracted from initial implementation inside useVisibleCenterItem to enable isolated testing.
 */
export interface CenterScoringInput {
  visibilityRatio: number; // 0..1
  normalizedDistance: number; // 0 at center, grows outward (typically 0..1+)
}

/**
 * Compute score for an item based on visibility and distance from viewport center.
 * Higher is better. We retain legacy linear combination for now for backward compatibility.
 * Formula: visibilityRatio - normalizedDistance
 */
export function computeCenterScore({
  visibilityRatio,
  normalizedDistance,
}: CenterScoringInput): number {
  return visibilityRatio - normalizedDistance;
}

export interface BestCenterCandidate {
  index: number; // winning index, or -1 if none visible
  score: number; // winning score ( -Infinity if none )
}

export interface ResolveBestCenterParams {
  candidates: Array<{ index: number; score: number }>;
  /** Tie break preference: 'lower-index' (default) chooses the smaller index when scores equal. */
  tieBreak?: 'lower-index' | 'higher-index';
}

/**
 * Resolve the best center candidate applying tie-break rule.
 */
export function resolveBestCenter({
  candidates,
  tieBreak = 'lower-index',
}: ResolveBestCenterParams): BestCenterCandidate {
  if (candidates.length === 0) return { index: -1, score: -Infinity };
  let best = candidates[0];
  for (let i = 1; i < candidates.length; i++) {
    const c = candidates[i];
    if (c.score > best.score) {
      best = c;
    } else if (c.score === best.score) {
      if (tieBreak === 'lower-index' && c.index < best.index) best = c;
      if (tieBreak === 'higher-index' && c.index > best.index) best = c;
    }
  }
  return best;
}
