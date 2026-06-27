// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Compute a clamped percentage (0-100) from current/total.
 * Returns 0 for invalid totals (zero or negative).
 */
export function computePercentage(current: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((current / total) * 100)));
}
