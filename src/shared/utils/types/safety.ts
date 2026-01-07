/**
 * Safely parses a string into an integer with fallback to 0.
 *
 * Handles null/undefined inputs and invalid parse results by returning 0.
 * Useful for configuration values, API parameters, and user input validation.
 *
 * @param value - String to parse, or null/undefined (safe to pass)
 * @param radix - Numeric base for parsing (default: 10, range: 2-36)
 * @returns Parsed integer, or 0 if value is null/undefined/invalid
 *
 * @example
 * safeParseInt('42');        // → 42
 * safeParseInt('0xFF', 16);  // → 255
 * safeParseInt(null);        // → 0
 * safeParseInt('abc');       // → 0
 */
export function safeParseInt(value: string | undefined | null, radix: number = 10): number {
  if (value == null) {
    return 0;
  }

  const result = Number.parseInt(value, radix);
  return Number.isNaN(result) ? 0 : result;
}

/**
 * Constrains a number to fall within a specified range.
 *
 * Clamps the input value between min and max, inclusive.
 * Common use cases: scaling factors (0-1), opacity, progress (0-100).
 *
 * @param value - Number to clamp
 * @param min - Minimum allowed value (default: 0)
 * @param max - Maximum allowed value (default: 1)
 * @returns Value clamped to [min, max] range
 *
 * @example
 * clamp(0.5, 0, 1);    // → 0.5
 * clamp(-5, 0, 10);    // → 0
 * clamp(150, 0, 100);  // → 100
 */
export function clamp(value: number, min: number = 0, max: number = 1): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Safely clamps an index to valid array bounds.
 *
 * Ensures the index falls within [0, length-1] range.
 * Handles non-finite values and invalid array lengths gracefully.
 *
 * @param index - Index value to validate and clamp
 * @param length - Array length (must be > 0; if ≤ 0, returns 0)
 * @returns Valid array index in range [0, length-1], or 0 on invalid input
 *
 * @example
 * clampIndex(5, 10);    // → 5
 * clampIndex(-2, 10);   // → 0
 * clampIndex(15, 10);   // → 9
 * clampIndex(NaN, 10);  // → 0
 * clampIndex(0, 0);     // → 0 (invalid length)
 */
export function clampIndex(index: number, length: number): number {
  if (!Number.isFinite(index) || length <= 0) {
    return 0;
  }
  return clamp(Math.floor(index), 0, length - 1);
}
