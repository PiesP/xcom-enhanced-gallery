// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Retry-fetch utility: HTTP status error handling with configurable backoff.
 */

import { DEFAULT_BACKOFF_BASE_MS, DEFAULT_REQUEST_TIMEOUT_MS } from '@constants/performance';
import { withRetry } from '@shared/async/retry';
import { getUserCancelledAbortErrorFromSignal, isAbortError } from '@shared/error/cancellation';
import { getHttpRequestService } from '@shared/services/http-request-service';

class HttpStatusError extends Error {
  override readonly name = 'HttpStatusError';

  constructor(readonly status: number) {
    super(`HTTP error: ${status}`);
  }
}

const isRetryableStatus = (status: number): boolean =>
  status === 0 ||
  status === 408 ||
  status === 425 ||
  status === 429 ||
  (status >= 500 && status < 600);

const getStatusFromError = (error: unknown): number | null => {
  if (!error || typeof error !== 'object' || !('status' in error)) return null;
  const statusValue = (error as { status?: unknown }).status;
  return typeof statusValue === 'number' ? statusValue : null;
};

/**
 * Fetches a URL as an ArrayBuffer with configurable retries and exponential backoff.
 *
 * @param url - The URL to fetch
 * @param retries - Maximum number of retry attempts
 * @param signal - Optional AbortSignal for cancellation
 * @param backoffBaseMs - Base delay for exponential backoff (default: 200ms)
 * @returns Response body as Uint8Array
 * @throws On non-retryable HTTP errors or abort signal rejection
 */
export async function fetchArrayBufferWithRetry(
  url: string,
  retries: number,
  signal?: AbortSignal,
  backoffBaseMs: number = DEFAULT_BACKOFF_BASE_MS
): Promise<Uint8Array> {
  if (signal?.aborted) {
    throw getUserCancelledAbortErrorFromSignal(signal);
  }

  const httpService = getHttpRequestService();
  const maxAttempts = Math.max(1, retries + 1);

  const result = await withRetry(
    async () => {
      if (signal?.aborted) {
        throw getUserCancelledAbortErrorFromSignal(signal);
      }

      const response = await httpService.get<ArrayBuffer>(url, {
        responseType: 'arraybuffer' as const,
        timeout: DEFAULT_REQUEST_TIMEOUT_MS,
        ...(signal ? { signal } : {}),
      });

      if (!response.ok) {
        throw new HttpStatusError(response.status);
      }

      return new Uint8Array(response.data);
    },
    {
      maxAttempts,
      baseDelayMs: backoffBaseMs,
      ...(signal ? { signal } : {}),
      shouldRetry: (error) => {
        if (isAbortError(error)) return false;
        const status = getStatusFromError(error);
        if (status === null) return true;
        return isRetryableStatus(status);
      },
    }
  );

  // If successful, return data
  if (result.success) {
    return result.data;
  }

  // If the caller's signal is aborted, always normalize to user-facing AbortError
  if (signal?.aborted) {
    throw getUserCancelledAbortErrorFromSignal(signal);
  }

  // Otherwise, throw the error from the last failed attempt
  throw result.error;
}
