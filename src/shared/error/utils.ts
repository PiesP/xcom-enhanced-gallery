/**
 * Lightweight error helpers used by download services.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in (error as Record<string, unknown>)) {
    const message = (error as { message: unknown }).message;
    return typeof message === 'string' ? message : String(message ?? '');
  }

  if (error == null) {
    return '';
  }

  return String(error);
}
