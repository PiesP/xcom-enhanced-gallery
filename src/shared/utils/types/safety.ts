/**
 * Safe parseInt function
 * @param value - String to parse (null/undefined allowed)
 * @param radix - Radix (default: 10)
 * @returns Parsed integer or 0 (on parse failure)
 */
export function safeParseInt(value: string | undefined | null, radix: number = 10): number {
  if (value == null) {
    return 0;
  }

  const result = Number.parseInt(value, radix);
  return Number.isNaN(result) ? 0 : result;
}

/**
 * Clamp a number within a range
 * @param value - Number to clamp
 * @param min - Minimum value (default: 0)
 * @param max - Maximum value (default: 1)
 * @returns Clamped value
 */
export function clamp(value: number, min: number = 0, max: number = 1): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Clamp an index within array bounds (0 to length-1)
 * @param index - Index to clamp
 * @param length - Array length (must be > 0)
 * @returns Valid index, or 0 if length <= 0
 */
export function clampIndex(index: number, length: number): number {
  if (!Number.isFinite(index) || length <= 0) {
    return 0;
  }
  return clamp(Math.floor(index), 0, length - 1);
}
