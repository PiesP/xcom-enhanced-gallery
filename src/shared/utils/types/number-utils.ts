// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Safely parse an integer from any input.
 * Returns 0 for null, undefined, empty string, or non-numeric values.
 * @param value - Value to parse (string, number, null, undefined)
 * @param radix - Number base (default: 10)
 * @returns Parsed integer or 0 on invalid input
 */
export function safeParseInt(value: unknown, radix = 10): number {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = parseInt(String(value), radix);
  return Number.isFinite(parsed) ? parsed : 0;
}

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
