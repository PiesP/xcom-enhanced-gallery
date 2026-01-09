/**
 * Computes indices to preload around current item with bounds safety
 */

import { clamp, clampIndex } from '@shared/utils/types/safety';

/**
 * Computes preload indices around current index
 *
 * @param currentIndex - Reference index (clamped to valid range)
 * @param total - Total items (must be positive finite)
 * @param count - Items to preload per direction (clamped to 0-20)
 * @returns Indices ordered by proximity (previous first, then next)
 */
export function computePreloadIndices(
  currentIndex: number,
  total: number,
  count: number
): number[] {
  const safeTotal = Number.isFinite(total) && total > 0 ? Math.floor(total) : 0;
  if (safeTotal === 0) return [];

  const safeIndex = clampIndex(Math.floor(currentIndex), safeTotal);
  const safeCount = clamp(Math.floor(count), 0, 20);
  if (safeCount === 0) return [];

  const indices: number[] = [];

  for (let i = 1; i <= safeCount; i += 1) {
    const idx = safeIndex - i;
    if (idx >= 0) indices.push(idx);
    else break;
  }

  for (let i = 1; i <= safeCount; i += 1) {
    const idx = safeIndex + i;
    if (idx < safeTotal) indices.push(idx);
    else break;
  }

  return indices;
}
