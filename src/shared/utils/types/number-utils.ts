// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Constrain a number to a specified range.
 * @param value - Number to clamp
 * @param min - Minimum value (default: 0)
 * @param max - Maximum value (default: 1)
 * @returns Value clamped to [min, max]
 */
export function clamp(value: number, min: number = 0, max: number = 1): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Safely clamp an index to valid array bounds.
 * Handles non-finite values and invalid lengths.
 * @param index - Index to validate
 * @param length - Array length
 * @returns Valid index in [0, length-1] or 0 on invalid input
 */
export function clampIndex(index: number, length: number): number {
  if (!Number.isFinite(index) || length <= 0) {
    return 0;
  }
  return clamp(Math.floor(index), 0, length - 1);
}
