/**
 * @fileoverview Gallery preload utilities
 * @description Compute indices to preload around current item with bounds safety.
 * @module performance/preload
 */

import { clamp, clampIndex } from '@shared/utils/types/safety';

/**
 * Compute indices to preload around a current index.
 *
 * Returns an array of indices representing items to preload before and after
 * the current index. Items are prioritized by proximity (closest items first).
 * The current index itself is excluded from the result.
 *
 * @param currentIndex - The reference index (will be clamped to valid range)
 * @param total - Total number of items (must be positive finite number)
 * @param count - Number of items to preload in each direction (clamped to 0-20)
 * @returns Array of preload indices, ordered by proximity (previous items first, then next items)
 *
 * @example
 * // With 10 items, preload 2 before/after index 5
 * computePreloadIndices(5, 10, 2) // [4, 3, 6, 7]
 *
 * @example
 * // At bounds: only includes valid indices
 * computePreloadIndices(0, 10, 3) // [1, 2, 3]
 * computePreloadIndices(9, 10, 2) // [8, 7]
 */
export function computePreloadIndices(
  currentIndex: number,
  total: number,
  count: number
): number[] {
  // Normalize and validate total
  const safeTotal: number = Number.isFinite(total) && total > 0 ? Math.floor(total) : 0;

  // Early exit for empty or invalid cases
  if (safeTotal === 0) return [];

  // Normalize and clamp current index
  const safeIndex: number = clampIndex(Math.floor(currentIndex), safeTotal);

  // Normalize and clamp preload count (reasonable upper limit)
  const safeCount: number = clamp(Math.floor(count), 0, 20);

  // Early exit if no preload count requested
  if (safeCount === 0) return [];

  const indices: number[] = [];

  // Preload previous items in reverse order (closest first)
  for (let i = 1; i <= safeCount; i += 1) {
    const idx = safeIndex - i;
    if (idx >= 0) {
      indices.push(idx);
    } else {
      break;
    }
  }

  // Preload next items in forward order (closest first)
  for (let i = 1; i <= safeCount; i += 1) {
    const idx = safeIndex + i;
    if (idx < safeTotal) {
      indices.push(idx);
    } else {
      break;
    }
  }

  return indices;
}
