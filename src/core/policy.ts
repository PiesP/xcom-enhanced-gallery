import { normalizeErrorMessage } from '@shared/error/normalize';

export const COMMAND_RUNTIME_STORAGE_KEY = 'xeg:command-runtime:v1';

export const COMMAND_RUNTIME_DEFAULT_TICK_MS = 30_000;

export function formatErrorMessage(error: unknown): string {
  return normalizeErrorMessage(error);
}
