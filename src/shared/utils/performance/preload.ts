/**
 * @fileoverview Gallery preload utilities
 * @description Compute indices to preload around current item with bounds safety.
 */

import { clamp, clampIndex } from '@shared/utils/types/safety';

/**
 * Compute indices to preload around current index.
 * - Includes up to `count` items before and after the current index within [0, total).
 * - Excludes the current index itself by default.
 */
export function computePreloadIndices(
  currentIndex: number,
  total: number,
  count: number,
): number[] {
  const safeTotal = Number.isFinite(total) && total > 0 ? Math.floor(total) : 0;
  const safeIndex = clampIndex(Math.floor(currentIndex), safeTotal);
  const safeCount = clamp(Math.floor(count), 0, 20);

  if (safeTotal === 0 || safeCount === 0) return [];

  const indices: number[] = [];

  // Preload previous items (closest first)
  for (let i = 1; i <= safeCount; i++) {
    const idx = safeIndex - i;
    if (idx >= 0) indices.push(idx);
    else break;
  }

  // Preload next items (closest first)
  for (let i = 1; i <= safeCount; i++) {
    const idx = safeIndex + i;
    if (idx < safeTotal) indices.push(idx);
    else break;
  }

  return indices;
}
