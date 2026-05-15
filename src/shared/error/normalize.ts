/**
 * @fileoverview Error message normalization helper
 * @description Extract a meaningful error string from any error type.
 */

export function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message || error.name || 'Error';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error == null) {
    return 'Unknown error';
  }

  if (typeof error === 'object') {
    const record = error as Record<string, unknown>;
    if (typeof record.message === 'string') return record.message;
    try {
      return JSON.stringify(record);
    } catch {
      return String(record);
    }
  }

  return String(error);
}
