/**
 * @fileoverview Pure exponential backoff utilities.
 */

export interface ExponentialBackoffArgs {
  attempt: number;
  baseDelayMs: number;
}

export function getExponentialBackoffDelayMs(args: ExponentialBackoffArgs): number {
  const { attempt, baseDelayMs } = args;
  return baseDelayMs * 2 ** attempt;
}
