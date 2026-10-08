// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Retry-fetch utility: HTTP status error handling with configurable backoff.
 */

import { DEFAULT_BACKOFF_BASE_MS, DEFAULT_REQUEST_TIMEOUT_MS } from '@constants/performance';
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

/** Fetch a bounded binary response while retaining its live storage owner. */
export async function fetchOwnedArrayBufferWithRetry(
  url: string,
  retries: number,
  signal: AbortSignal | undefined,
  backoffBaseMs: number | undefined,
  maxResponseBytes: number,
  budget: LiveByteBudget = downloadLiveByteBudget
): Promise<OwnedBinary<Uint8Array>> {
  if (signal?.aborted) throw getUserCancelledAbortErrorFromSignal(signal);

  const result = await withRetry(
    async () => {
      if (signal?.aborted) throw getUserCancelledAbortErrorFromSignal(signal);
      const response = await getHttpRequestService().getOwnedBinary<ArrayBuffer>(url, {
        responseType: 'arraybuffer',
        timeout: DEFAULT_REQUEST_TIMEOUT_MS,
        maxResponseBytes,
        budget,
        ...(signal ? { signal } : {}),
      });
      if (!response.ok) {
        response.lease.release();
        throw new HttpStatusError(response.status);
      }
      return { value: new Uint8Array(response.data), lease: response.lease };
    },
    {
      maxAttempts: Math.max(1, retries + 1),
      baseDelayMs: backoffBaseMs ?? DEFAULT_BACKOFF_BASE_MS,
      ...(signal ? { signal } : {}),
      shouldRetry: (error) => {
        if (isAbortError(error)) return false;
        if (isHttpResponseSizeLimitError(error)) return false;
        if (error instanceof DownloadResourceLimitError) return false;
        const status = getStatusFromError(error);
        return status === null || isRetryableStatus(status);
      },
    }
  );

  if (result.success) return result.data;
  if (signal?.aborted) throw getUserCancelledAbortErrorFromSignal(signal);
  throw result.error;
}
