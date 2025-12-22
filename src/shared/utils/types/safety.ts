import { isRecord } from '@shared/utils/types/guards';

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

export function safeParseFloat(value: string | undefined | null): number {
  if (value == null) {
    return 0;
  }

  const result = Number.parseFloat(value);
  return Number.isNaN(result) ? 0 : result;
}

export function undefinedToNull<T>(value: T | undefined): T | null {
  return value === undefined ? null : value;
}

export function stringWithDefault(value: string | undefined, fallback: string = ''): string {
  return value === undefined ? fallback : value;
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

export function safeElementCheck(value: unknown): value is Element {
  if (value == null) {
    return false;
  }

  try {
    return typeof Element !== 'undefined' && value instanceof Element;
  } catch {
    return false;
  }
}

export function safeTweetId(value: string | undefined | null): string {
  const raw = value ?? '';
  if (raw.trim().length > 0) {
    return raw;
  }

  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      const uuid = crypto.randomUUID();
      return `generated_${uuid}`;
    } catch {
      // ignore
    }
  }

  const rand = Math.random().toString(36).substring(2, 9);
  return `generated_${Date.now()}_${rand}`;
}

/**
 * Minimal global-like object check.
 *
 * Used by tests/mutation coverage helpers.
 */
export function isGlobalLike(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.requestIdleCallback === 'function' || typeof record.setTimeout === 'function'
  );
}
