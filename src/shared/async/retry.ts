// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Retry utility with exponential backoff.
 */

import { delay } from '@shared/async/delay';
import { isAbortError } from '@shared/error/cancellation';

export interface RetryOptions {
  readonly maxAttempts?: number;
  readonly baseDelayMs?: number;
  readonly maxDelayMs?: number;
  readonly signal?: AbortSignal;
  readonly onRetry?: (attempt: number, error: unknown, nextDelayMs: number) => void;
  readonly shouldRetry?: (error: unknown) => boolean;
  /** Optional random function for jitter (inject for deterministic tests) */
  readonly random?: () => number;
}

export type RetryResult<T> =
  | { readonly success: true; readonly data: T; readonly attempts: number }
  | { readonly success: false; readonly error: unknown; readonly attempts: number };

const DEFAULTS = {
  maxAttempts: 3,
  baseDelayMs: 200,
  maxDelayMs: 10000,
} as const;

/**
 * Calculate exponential backoff delay with jitter.
 * Exported for testability — accepts `random` for deterministic jitter.
 *
 * @param attempt - Current attempt number (0-indexed)
 * @param base - Base delay in milliseconds
 * @param max - Maximum delay in milliseconds
 * @param random - Random function returning [0, 1) (default: Math.random)
 */
export function calcBackoff(
  attempt: number,
  base: number,
  max: number,
  random: () => number = Math.random
): number {
  const exp = base * 2 ** attempt;
  const jitter = random() * 0.25 * exp;
  return Math.min(Math.floor(exp + jitter), max);
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxAttempts = DEFAULTS.maxAttempts,
    baseDelayMs = DEFAULTS.baseDelayMs,
    maxDelayMs = DEFAULTS.maxDelayMs,
    signal,
    onRetry,
    shouldRetry,
    random,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (signal?.aborted) {
      return {
        success: false,
        error: signal.reason ?? new DOMException('Aborted', 'AbortError'),
        attempts: attempt,
      };
    }

    try {
      const data = await operation();
      return { success: true, data, attempts: attempt + 1 };
    } catch (error) {
      lastError = error;

      if (isAbortError(error)) {
        return { success: false, error, attempts: attempt + 1 };
      }

      if (shouldRetry && !shouldRetry(error)) {
        return { success: false, error, attempts: attempt + 1 };
      }

      if (attempt + 1 >= maxAttempts) break;

      const delayMs = calcBackoff(attempt, baseDelayMs, maxDelayMs, random);
      onRetry?.(attempt + 1, error, delayMs);

      try {
        await delay(delayMs, signal);
      } catch (delayError) {
        if (isAbortError(delayError)) {
          return { success: false, error: delayError, attempts: attempt + 1 };
        }
        throw delayError;
      }
    }
  }

  return { success: false, error: lastError, attempts: maxAttempts };
}
