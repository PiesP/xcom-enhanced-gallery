/**
 * @fileoverview Error message normalization helpers.
 *
 * Bundle-size note:
 * Keep conversions minimal and rely on native string coercion.
 */

type ErrorMessageMode = 'normalized' | 'raw';

function formatErrorMessage(error: unknown, mode: ErrorMessageMode): string {
  if (error instanceof Error) {
    return mode === 'normalized' ? error.message || error.name || 'Error' : error.message;
  }

  if (typeof error === 'string') return error;
  if (error == null) return mode === 'normalized' ? String(error) : '';

  if (typeof error === 'object') {
    const record = error as Record<string, unknown>;
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
  }

  return String(error);
}

export function normalizeErrorMessage(error: unknown): string {
  return formatErrorMessage(error, 'normalized');
}

export function getErrorMessage(error: unknown): string {
  return formatErrorMessage(error, 'raw');
}
