// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Retry utility with exponential backoff.
 */

import { sleep } from '@piesp/browser-core/async';
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
  /** Elapsed interactive budget, including operation time and retry waits. */
  readonly maxElapsedMs?: number;
  /** Monotonic elapsed clock; injected only for deterministic tests. */
  readonly now?: () => number;
  readonly retryAfterMs?: (error: unknown) => number | undefined;
}

export type RetryResult<T> =
  | { readonly success: true; readonly data: T; readonly attempts: number }
  | {
      readonly success: false;
      readonly error: unknown;
      readonly attempts: number;
      readonly deferredForMs?: number;
    };

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
  operation: (remainingMs: number | undefined) => Promise<T>,
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
    maxElapsedMs,
    now = () => performance.now(),
    retryAfterMs,
  } = options;

  let lastError: unknown;
  const startedAt = now();
  const boundedAttempts = Number.isFinite(maxAttempts)
    ? Math.max(1, Math.min(5, Math.floor(maxAttempts)))
    : DEFAULTS.maxAttempts;
  const boundedBudget =
    maxElapsedMs === undefined
      ? undefined
      : Number.isFinite(maxElapsedMs)
        ? Math.max(0, maxElapsedMs)
        : 0;

  for (let attempt = 0; attempt < boundedAttempts; attempt++) {
    if (signal?.aborted) {
      return {
        success: false,
        error: signal.reason ?? new DOMException('Aborted', 'AbortError'),
        attempts: attempt,
      };
    }

    const remainingBeforeAttempt =
      boundedBudget === undefined ? undefined : Math.max(0, boundedBudget - (now() - startedAt));
    if (attempt > 0 && remainingBeforeAttempt === 0) {
      return { success: false, error: lastError, attempts: attempt };
    }

    try {
      const data = await operation(remainingBeforeAttempt);
      return { success: true, data, attempts: attempt + 1 };
    } catch (error) {
      lastError = error;

      if (isAbortError(error)) {
        return { success: false, error, attempts: attempt + 1 };
      }

      if (shouldRetry && !shouldRetry(error)) {
        return { success: false, error, attempts: attempt + 1 };
      }

      if (attempt + 1 >= boundedAttempts) break;

      const backoffMs = calcBackoff(attempt, baseDelayMs, maxDelayMs, random);
      const guidedMs = retryAfterMs?.(error);
      const usableGuidance =
        typeof guidedMs === 'number' && Number.isFinite(guidedMs) && guidedMs >= 0
          ? guidedMs
          : undefined;
      const delayMs = Math.max(backoffMs, usableGuidance ?? 0);
      const remainingMs =
        boundedBudget === undefined ? undefined : boundedBudget - (now() - startedAt);
      if (remainingMs !== undefined && delayMs > remainingMs) {
        return {
          success: false,
          error,
          attempts: attempt + 1,
          ...(usableGuidance !== undefined && usableGuidance > remainingMs
            ? { deferredForMs: usableGuidance }
            : {}),
        };
      }
      onRetry?.(attempt + 1, error, delayMs);

      try {
        await sleep(delayMs, signal);
      } catch (delayError) {
        if (isAbortError(delayError)) {
          return { success: false, error: delayError, attempts: attempt + 1 };
        }
        throw delayError;
      }
    }
  }

  return { success: false, error: lastError, attempts: boundedAttempts };
}
