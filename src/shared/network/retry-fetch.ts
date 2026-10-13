// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Retry-fetch utility: HTTP status error handling with configurable backoff.
 */

import { DEFAULT_BACKOFF_BASE_MS, DEFAULT_REQUEST_TIMEOUT_MS } from '@constants/performance';
import type { HttpErrorCategory } from '@platform/types';
import { withRetry } from '@shared/async/retry';
import { getUserCancelledAbortErrorFromSignal, isAbortError } from '@shared/error/cancellation';
import { isHttpResponseSizeLimitError } from '@shared/error/http-response-size-limit-error';
import {
  DownloadResourceLimitError,
  downloadLiveByteBudget,
  type LiveByteBudget,
  type OwnedBinary,
} from '@shared/services/download/live-byte-budget';
import { getHttpRequestService } from '@shared/services/http-request-service';

class HttpStatusError extends Error {
  override readonly name = 'HttpStatusError';

  constructor(
    readonly status: number,
    readonly retryAfterMs?: number,
    readonly readable?: boolean,
    readonly category: HttpErrorCategory = 'http'
  ) {
    super(`HTTP error: ${status}`);
  }
}

/** Server guidance does not fit the interactive retry budget. */
export class RetryDeferredError extends Error {
  override readonly name = 'RetryDeferredError';
  readonly category: 'rate_limited' | 'deferred';

  constructor(
    readonly status: number,
    readonly retryAfterMs: number,
    readonly readable?: boolean,
    readonly transportCategory?: HttpErrorCategory
  ) {
    super(`Retry deferred for HTTP ${status}`);
    this.category = status === 429 ? 'rate_limited' : 'deferred';
  }
}

const INTERACTIVE_RETRY_BUDGET_MS = 90_000;

const isRetryableStatus = (status: number): boolean =>
  status === 0 ||
  status === 408 ||
  status === 425 ||
  status === 429 ||
  (status >= 500 && status < 600);

const getStatusFromError = (error: unknown): number | null => {
  if (!error || typeof error !== 'object' || !('status' in error)) {
    return null;
  }
  const statusValue = (error as { status?: unknown }).status;
  return typeof statusValue === 'number' ? statusValue : null;
};

const getRetryAfterFromError = (error: unknown): number | undefined => {
  if (!error || typeof error !== 'object' || !('retryAfterMs' in error)) {
    return undefined;
  }
  const value = error.retryAfterMs;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
};

const getReadabilityFromError = (error: unknown): boolean | undefined => {
  if (!error || typeof error !== 'object' || !('readable' in error)) {
    return undefined;
  }
  return typeof error.readable === 'boolean' ? error.readable : undefined;
};

const getCategoryFromError = (error: unknown): HttpErrorCategory | undefined => {
  if (!error || typeof error !== 'object' || !('category' in error)) {
    return undefined;
  }
  const category = error.category;
  return category === 'http' ||
    category === 'network' ||
    category === 'timeout' ||
    category === 'abort' ||
    category === 'resource_limit' ||
    category === 'unreadable' ||
    category === 'invalid_url'
    ? category
    : undefined;
};

/** Fetch a bounded binary response while retaining its live storage owner. */
export async function fetchOwnedArrayBufferWithRetry(
  url: string,
  retries: number,
  signal: AbortSignal | undefined,
  backoffBaseMs: number | undefined,
  maxResponseBytes: number,
  budget: LiveByteBudget = downloadLiveByteBudget
): Promise<OwnedBinary<Uint8Array>> {
  if (signal?.aborted) {
    throw getUserCancelledAbortErrorFromSignal(signal);
  }

  const result = await withRetry(
    async (remainingMs) => {
      if (signal?.aborted) {
        throw getUserCancelledAbortErrorFromSignal(signal);
      }
      const response = await getHttpRequestService().getOwnedBinary<ArrayBuffer>(url, {
        responseType: 'arraybuffer',
        timeout: Math.max(
          1,
          Math.min(DEFAULT_REQUEST_TIMEOUT_MS, remainingMs ?? DEFAULT_REQUEST_TIMEOUT_MS)
        ),
        maxResponseBytes,
        budget,
        ...(signal ? { signal } : {}),
      });
      if (!response.ok) {
        response.lease.release();
        throw new HttpStatusError(
          response.status,
          response.retryAfterMs,
          response.readable,
          response.errorCategory
        );
      }
      return { value: new Uint8Array(response.data), lease: response.lease };
    },
    {
      maxAttempts: Math.max(1, retries + 1),
      baseDelayMs: backoffBaseMs ?? DEFAULT_BACKOFF_BASE_MS,
      maxElapsedMs: INTERACTIVE_RETRY_BUDGET_MS,
      retryAfterMs: getRetryAfterFromError,
      ...(signal ? { signal } : {}),
      shouldRetry: (error) => {
        if (isAbortError(error)) {
          return false;
        }
        if (isHttpResponseSizeLimitError(error)) {
          return false;
        }
        if (error instanceof DownloadResourceLimitError) {
          return false;
        }
        const category = getCategoryFromError(error);
        if (category === 'invalid_url' || category === 'abort' || category === 'resource_limit') {
          return false;
        }
        const status = getStatusFromError(error);
        return status === null || isRetryableStatus(status);
      },
    }
  );

  if (result.success) {
    return result.data;
  }
  if (signal?.aborted) {
    throw getUserCancelledAbortErrorFromSignal(signal);
  }
  const deferredStatus = getStatusFromError(result.error);
  if (result.deferredForMs !== undefined && deferredStatus !== null) {
    throw new RetryDeferredError(
      deferredStatus,
      result.deferredForMs,
      getReadabilityFromError(result.error),
      getCategoryFromError(result.error)
    );
  }
  throw result.error;
}
