import { getExponentialBackoffDelayMs as calcBackoffDelayMs } from '@shared/async/retry';

export interface ExponentialBackoffArgs {
  attempt: number;
  baseDelayMs: number;
}

export function getExponentialBackoffDelayMs(args: ExponentialBackoffArgs): number {
  return calcBackoffDelayMs(args.attempt, args.baseDelayMs);
}
