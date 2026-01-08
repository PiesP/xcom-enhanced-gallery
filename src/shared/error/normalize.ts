/**
 * @fileoverview Error message normalization helpers
 * @description Extract and format error messages from various error types (minimal bundle).
 */

/**
 * @fileoverview Error message normalization helpers
 * @description Extract and format error messages from various error types (minimal bundle).
 */

type ErrorMessageMode = 'normalized' | 'raw';

const extractFromError = (error: Error, mode: ErrorMessageMode): string =>
  mode === 'normalized' ? error.message || error.name || 'Error' : error.message;

const extractFromObject = (record: Record<string, unknown>, mode: ErrorMessageMode): string => {
  const message = record.message;
  if (typeof message === 'string') return message;

  if (mode === 'raw') {
    return 'message' in record ? String(message ?? '') : String(record);
  }

  try {
    return JSON.stringify(record);
  } catch {
    return String(record);
  }
};

/**
 * Core error message formatting logic.
 * Handles Error instances, strings, null/undefined, objects, and fallback string coercion.
 * @param error - The error value to extract a message from
 * @param mode - Output format mode
 * @returns Formatted error message string
 */
function formatErrorMessage(error: unknown, mode: ErrorMessageMode): string {
  // Handle native Error instances
  if (error instanceof Error) {
    return extractFromError(error, mode);
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
    return extractFromObject(error as Record<string, unknown>, mode);
  }

  // Fallback for primitives (number, boolean, symbol, bigint)
  return String(error);
}

/**
 * Normalize error value into a guaranteed non-empty string.
 * Always returns a meaningful string suitable for logging and error tracking.
 * @param error - The error value to normalize
 * @returns A non-empty normalized error message
 */
export function normalizeErrorMessage(error: unknown): string {
  return formatErrorMessage(error, 'normalized');
}

/**
 * Extract raw error message from error value.
 * Returns message string directly without fallback formatting (may be empty).
 * @param error - The error value to extract message from
 * @returns Raw error message string (may be empty)
 */
export function getErrorMessage(error: unknown): string {
  return formatErrorMessage(error, 'raw');
}
