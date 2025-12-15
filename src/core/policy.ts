export const COMMAND_RUNTIME_STORAGE_KEY = 'xeg:command-runtime:v1';

export const COMMAND_RUNTIME_DEFAULT_TICK_MS = 30_000;

export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
