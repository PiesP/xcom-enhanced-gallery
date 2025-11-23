/**
 * @fileoverview Gallery preload utilities
 * @description Compute indices to preload around current item with bounds safety.
 */

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
  const safeIndex = Math.min(
    Math.max(0, Math.floor(currentIndex)),
    Math.max(0, safeTotal - 1),
  );
  const safeCount = Math.max(0, Math.min(20, Math.floor(count)));

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
