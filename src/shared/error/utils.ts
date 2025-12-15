/**
 * Lightweight error helpers used by download services.
 */
import { getErrorMessage as getErrorMessageInternal } from '@shared/error/normalize';

export function getErrorMessage(error: unknown): string {
  return getErrorMessageInternal(error);
}
