/**
 * @fileoverview Error message normalization helpers.
 *
 * Bundle-size note:
 * Keep conversions minimal and rely on native string coercion.
 */

export function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message || error.name || 'Error';
  }

  if (typeof error === 'string') return error;
  if (error == null) return String(error);

  if (typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const message = record.message;
    if (typeof message === 'string') return message;
    try {
      return JSON.stringify(record);
    } catch {
      return String(record);
    }
  }

  return String(error);
}

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
