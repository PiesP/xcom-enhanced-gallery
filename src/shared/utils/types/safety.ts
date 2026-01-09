/**
 * Safely parse a string to integer with fallback to 0.
 * Handles null/undefined and invalid inputs.
 * @param value - String to parse or null/undefined
 * @param radix - Base for parsing (default: 10)
 * @returns Parsed integer or 0
 */
export function safeParseInt(value: string | undefined | null, radix: number = 10): number {
  if (value == null) {
    return 0;
  }
  const result = Number.parseInt(value, radix);
  return Number.isNaN(result) ? 0 : result;
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
