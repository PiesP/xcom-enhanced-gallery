/**
 * @fileoverview Error message normalization helpers.
 *
 * Provides utilities for extracting and formatting error messages from various error types.
 * Designed for minimal bundle size by relying on native string coercion.
 *
 * @module shared/error/normalize
 */

/**
 * Defines the output format mode for error message extraction.
 *
 * - `normalized`: Always returns a non-empty string representation, suitable for logging.
 * - `raw`: Returns the raw message string, may be empty for non-error objects.
 */
type ErrorMessageMode = 'normalized' | 'raw';

/**
 * Core error message formatting logic.
 *
 * Handles Error instances, strings, null/undefined, objects with message properties,
 * and fallback string coercion.
 *
 * @param error - The error value to extract a message from
 * @param mode - Output format mode
 * @returns Formatted error message string
 *
 * @internal
 */
function formatErrorMessage(error: unknown, mode: ErrorMessageMode): string {
  // Handle native Error instances
  if (error instanceof Error) {
    return mode === 'normalized' ? error.message || error.name || 'Error' : error.message;
  }

  // Handle string values
  if (typeof error === 'string') {
    return error;
  }

  // Handle null/undefined
  if (error == null) {
    return mode === 'normalized' ? String(error) : '';
  }

  // Handle objects with potential message property
  if (typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const message = record.message;

    if (typeof message === 'string') {
      return message;
    }

    // Raw mode: return empty or string representation
    if (mode === 'raw') {
      return 'message' in record ? String(message ?? '') : String(record);
    }

    // Normalized mode: attempt JSON serialization, fallback to String()
    try {
      return JSON.stringify(record);
    } catch {
      return String(record);
    }
  }

  // Fallback for primitives (number, boolean, symbol, bigint)
  return String(error);
}

/**
 * Normalizes an error value into a guaranteed non-empty string.
 *
 * This function always returns a meaningful string representation,
 * suitable for logging and error tracking.
 *
 * @param error - The error value to normalize
 * @returns A non-empty normalized error message
 *
 * @example
 * ```ts
 * normalizeErrorMessage(new Error('Failed'));  // => 'Failed'
 * normalizeErrorMessage('Something went wrong'); // => 'Something went wrong'
 * normalizeErrorMessage(null);                  // => 'null'
 * normalizeErrorMessage({ message: 'Error' });  // => 'Error'
 * ```
 */
export function normalizeErrorMessage(error: unknown): string {
  return formatErrorMessage(error, 'normalized');
}

/**
 * Extracts the raw error message from an error value.
 *
 * Returns the message string directly without fallback formatting.
 * May return an empty string for non-error objects.
 *
 * @param error - The error value to extract message from
 * @returns Raw error message string (may be empty)
 *
 * @example
 * ```ts
 * getErrorMessage(new Error('Failed'));  // => 'Failed'
 * getErrorMessage('Something went wrong'); // => 'Something went wrong'
 * getErrorMessage(null);                  // => ''
 * getErrorMessage({ message: 'Error' });  // => 'Error'
 * ```
 */
export function getErrorMessage(error: unknown): string {
  return formatErrorMessage(error, 'raw');
}
