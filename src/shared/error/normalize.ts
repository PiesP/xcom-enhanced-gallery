/**
 * @fileoverview Error message normalization helpers.
 *
 * Bundle-size note:
 * Keep the surface minimal. Most call sites only need one of two fixed policies:
 * - normalizeErrorMessage: log-oriented (literal nullish + JSON object fallback)
 * - getErrorMessage: UI/service-oriented (empty nullish + String object fallback)
 */

function safeJsonStringify(value: object): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Standard log-oriented normalizer used across the app.
 *
 * Behavior matches the legacy implementation from app-error-reporter:
 * - Error: message or name
 * - object: message (string) or JSON.stringify fallback
 * - null/undefined: literal 'null'/'undefined'
 */
export function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message) return error.message;
    return error.name || 'Error';
  }

  if (typeof error === 'string') return error;
  if (error == null) return String(error);

  if (typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const message = record.message;
    if (typeof message === 'string') return message;
    return safeJsonStringify(record);
  }

  return String(error);
}

/**
 * UI/service-oriented error message extractor.
 *
 * Behavior matches the legacy implementation from error/utils.ts:
 * - Error: message only
 * - object with message: string(message ?? '')
 * - object: String(object)
 * - null/undefined: ''
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') return error;
  if (error == null) return '';

  if (typeof error === 'object') {
    const record = error as Record<string, unknown>;
    if ('message' in record) {
      return String(record.message ?? '');
    }
    return String(record);
  }

  return String(error);
}
