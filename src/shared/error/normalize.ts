/**
 * @fileoverview Error message normalization helper
 * @description Extract a meaningful error string from any error type.
 */

export function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message || error.name || 'Error';
  if (typeof error === 'string') return error;
  if (error == null) return 'Unknown error';
  if (typeof error === 'object') {
    const msg = (error as Record<string, unknown>).message;
    if (typeof msg === 'string') return msg;
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error);
}
