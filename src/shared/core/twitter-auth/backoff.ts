/**
 * Backoff helpers for Twitter-auth related flows.
 */

import { getExponentialBackoffDelayMs as getExponentialBackoffDelayMsInternal } from '@shared/async/retry';

export function getExponentialBackoffDelayMs(args: {
  readonly attempt: number;
  readonly baseDelayMs: number;
}): number;
export function getExponentialBackoffDelayMs(attempt: number, baseDelayMs: number): number;
export function getExponentialBackoffDelayMs(
  arg1: { readonly attempt: number; readonly baseDelayMs: number } | number,
  arg2?: number
): number {
  if (typeof arg1 === 'number') {
    return getExponentialBackoffDelayMsInternal(arg1, arg2 ?? 0);
  }

  return getExponentialBackoffDelayMsInternal(arg1.attempt, arg1.baseDelayMs);
}
