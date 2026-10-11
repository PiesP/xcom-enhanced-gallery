// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * MV3 extension download adapter.
 *
 * Relays download requests to the background service worker via
 * chrome.runtime.sendMessage (Promise-based).
 * The SW handles chrome.downloads.download() which requires permissions
 * unavailable in content scripts directly.
 *
 * Architecture notes:
 * - URL.createObjectURL is NOT available in Service Workers, so blob
 *   downloads create the object URL in the content script context.
 *   The object URL (string) is sent to the SW, which passes it to
 *   chrome.downloads.download(). This is critical: content-script blob
 *   URLs persist with the PAGE lifetime, whereas SW-created blob URLs
 *   become invalid when the ephemeral SW is terminated by Chrome's MV3
 *   idle timeout, causing silent download failures.
 * - Promise-based sendMessage is required; the callback pattern (3rd arg)
 *   does not work when the receiver responds asynchronously.
 * - Blob URLs remain owned by the content script until Chrome reports a
 *   terminal download state; ambiguous Blob responses are reconciled by URL.
 * - Direct URL downloads use the browser's native transfer and a persisted
 *   request-to-ID relationship. A lost response is reconciled without starting
 *   another download.
 */

import { BLOB_URL_REVOKE_DELAY_MS, DOWNLOAD_TIMEOUT_MS } from '@constants/performance';
import type {
  DownloadBlobStatusResponse,
  DownloadBlobUrlRequestMessage,
  DownloadDirectStatusResponse,
  DownloadRequestMessage,
  ExtensionMessageResponse,
} from '@extension/extension-message-types';
import { getUserCancelledAbortErrorFromSignal } from '@shared/error/cancellation';
import { browserApi } from './chrome-runtime';
import type { DownloadAdapter } from './types';

/**
 * Check if a sendMessage response indicates success.
 * Returns the structured error string on failure, or undefined on success.
 */
function unwrapResponse(response: unknown): string | undefined {
  if (!response || typeof response !== 'object') {
    return 'Empty or invalid response from background SW';
  }
  const r = response as Record<string, unknown>;
  if (r.success === true) return undefined;
  // Always return a string error, never undefined/null — the caller can
  // provide a fallback message.
  return typeof r.error === 'string' && r.error.length > 0 ? r.error : 'Download failed';
}

function sendCancelRequest(requestId: string, url?: string): void {
  try {
    void browserApi.runtime
      .sendMessage({
        type: 'DOWNLOAD_CANCEL_REQUEST',
        payload: { requestId, ...(url === undefined ? {} : { url }) },
      })
      .catch(() => undefined);
  } catch {
    // An unavailable runtime must not prevent local cancellation or status reconciliation.
  }
}

export class MV3DownloadAdapter implements DownloadAdapter {
  /** Browser-managed URL downloads do not materialize a full response in the page. */
  needsBlobFallback(): boolean {
    return false;
  }

  async download(
    url: string,
    filename: string,
    headers?: Record<string, string>,
    signal?: AbortSignal
  ): Promise<void> {
    await this.sendDirectDownloadRequest(url, filename, headers, signal);
  }

  async downloadBlob(
    blob: Blob,
    filename: string,
    signal?: AbortSignal,
    onObjectUrlReleased?: () => void
  ): Promise<void> {
    if (signal?.aborted) {
      onObjectUrlReleased?.();
      throw getUserCancelledAbortErrorFromSignal(signal);
    }
    let objectUrl: string;
    let requestId: string;
    try {
      requestId = crypto.randomUUID();
      objectUrl = URL.createObjectURL(blob);
    } catch (error: unknown) {
      onObjectUrlReleased?.();
      throw error;
    }
    let released = false;
    let terminalObserved = false;
    let polling = false;
    let pollDelayMs = 250;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;
    let requestSettled = false;
    let rejectAbort: ((reason: unknown) => void) | undefined;
    const release = (): void => {
      if (released) return;
      released = true;
      try {
        URL.revokeObjectURL(objectUrl);
      } finally {
        onObjectUrlReleased?.();
      }
    };
    const scheduleRelease = (): void => {
      if (terminalObserved || released) return;
      terminalObserved = true;
      signal?.removeEventListener('abort', onAbort);
      if (pollTimer !== undefined) clearTimeout(pollTimer);
      setTimeout(release, BLOB_URL_REVOKE_DELAY_MS);
    };
    const inspectStatus = async (): Promise<void> => {
      if (terminalObserved || polling) return;
      polling = true;
      try {
        const response: unknown = await browserApi.runtime.sendMessage({
          type: 'DOWNLOAD_BLOB_STATUS_REQUEST',
          payload: { requestId, objectUrl, ...(signal?.aborted ? { cancelRequested: true } : {}) },
        });
        if (
          response &&
          typeof response === 'object' &&
          'success' in response &&
          response.success === true &&
          'data' in response &&
          response.data &&
          typeof response.data === 'object'
        ) {
          const data = response.data as Partial<DownloadBlobStatusResponse>;
          if (data.requestId === requestId && data.status === 'terminal') scheduleRelease();
        }
      } catch {
        // An unavailable worker or failed lookup cannot prove native completion.
      } finally {
        polling = false;
        if (!terminalObserved) {
          pollTimer = setTimeout(() => void inspectStatus(), pollDelayMs);
          pollDelayMs = Math.min(pollDelayMs * 2, 5_000);
        }
      }
    };
    const startInspection = (): void => {
      if (!terminalObserved && pollTimer === undefined && !polling) void inspectStatus();
    };
    const onAbort = (): void => {
      sendCancelRequest(requestId);
      startInspection();
      if (!requestSettled) rejectAbort?.(getUserCancelledAbortErrorFromSignal(signal));
    };
    const abortPromise = signal
      ? new Promise<never>((_, reject) => {
          rejectAbort = reject;
        })
      : null;
    signal?.addEventListener('abort', onAbort, { once: true });
    const request: DownloadBlobUrlRequestMessage = {
      type: 'DOWNLOAD_BLOB_URL_REQUEST',
      payload: { objectUrl, filename, mimeType: blob.type, requestId },
    };

    let dispatched: Promise<unknown>;
    try {
      dispatched = browserApi.runtime.sendMessage(request);
    } catch (error: unknown) {
      // A synchronous throw happens before the request is handed to Chrome.
      scheduleRelease();
      throw error;
    }
    const responsePromise = dispatched.then(
      (response: unknown) => {
        requestSettled = true;
        if (
          response &&
          typeof response === 'object' &&
          'success' in response &&
          response.success === true
        ) {
          scheduleRelease();
        } else if (
          response &&
          typeof response === 'object' &&
          'data' in response &&
          response.data &&
          typeof response.data === 'object' &&
          'requestId' in response.data &&
          response.data.requestId === requestId &&
          'terminal' in response.data &&
          response.data.terminal === true
        ) {
          scheduleRelease();
        } else {
          startInspection();
        }
        return response as ExtensionMessageResponse;
      },
      (error: unknown) => {
        requestSettled = true;
        startInspection();
        throw error;
      }
    );
    const response = await (abortPromise
      ? Promise.race([responsePromise, abortPromise])
      : responsePromise);
    const error = unwrapResponse(response);
    if (error) throw new Error(error);
  }

  private async sendDirectDownloadRequest(
    url: string,
    filename: string,
    headers?: Record<string, string>,
    signal?: AbortSignal
  ): Promise<void> {
    if (signal?.aborted) {
      throw getUserCancelledAbortErrorFromSignal(signal);
    }

    const requestId = crypto.randomUUID();
    const request: DownloadRequestMessage = {
      type: 'DOWNLOAD_REQUEST',
      payload: { url, filename, requestId, mode: 'direct', ...(headers ? { headers } : {}) },
    };

    let rejectAbort: ((reason: unknown) => void) | undefined;
    let retainAbortListener = false;
    let handoffTimer: ReturnType<typeof setTimeout> | null = null;
    const cleanupAbortListener = (): void => {
      signal?.removeEventListener('abort', onAbort);
      if (handoffTimer !== null) {
        clearTimeout(handoffTimer);
        handoffTimer = null;
      }
    };
    const abortPromise = signal
      ? new Promise<never>((_, reject) => {
          rejectAbort = reject;
        })
      : null;
    const onAbort = (): void => {
      sendCancelRequest(requestId, url);
      cleanupAbortListener();
      rejectAbort?.(getUserCancelledAbortErrorFromSignal(signal));
    };

    signal?.addEventListener('abort', onAbort, { once: true });
    try {
      const deadline = performance.now() + DOWNLOAD_TIMEOUT_MS;
      const responsePromise = browserApi.runtime.sendMessage(request).then(
        (response: unknown) => ({ responded: true as const, response }),
        () => ({ responded: true as const, response: undefined })
      );
      const inspect = async (): Promise<DownloadDirectStatusResponse | undefined> => {
        try {
          const response: unknown = await browserApi.runtime.sendMessage({
            type: 'DOWNLOAD_DIRECT_STATUS_REQUEST',
            payload: { requestId, url, ...(signal?.aborted ? { cancelRequested: true } : {}) },
          });
          if (
            !response ||
            typeof response !== 'object' ||
            !('success' in response) ||
            response.success !== true ||
            !('data' in response) ||
            !response.data ||
            typeof response.data !== 'object'
          )
            return undefined;
          const data = response.data as Partial<DownloadDirectStatusResponse>;
          if (
            data.requestId !== requestId ||
            !['never-started', 'active', 'complete', 'interrupted', 'unknown'].includes(
              data.status ?? ''
            )
          ) {
            return undefined;
          }
          return data as DownloadDirectStatusResponse;
        } catch {
          return undefined;
        }
      };
      let lastError = 'Browser download state is unknown';
      let responsePending = true;
      let activeObserved = false;
      for (let attempt = 0; attempt < 3 || activeObserved; attempt += 1) {
        const remainingMs = deadline - performance.now();
        if (remainingMs <= 0) break;
        const delayMs = Math.min(attempt === 0 ? 1_500 : attempt < 3 ? 500 : 5_000, remainingMs);
        let timer: ReturnType<typeof setTimeout> | undefined;
        const tick = new Promise<{ responded: false; response: undefined }>((resolve) => {
          timer = setTimeout(() => resolve({ responded: false, response: undefined }), delayMs);
        });
        let reply: { responded: boolean; response: unknown };
        try {
          reply = await (abortPromise
            ? Promise.race([...(responsePending ? [responsePromise] : []), tick, abortPromise])
            : Promise.race([...(responsePending ? [responsePromise] : []), tick]));
        } finally {
          if (timer !== undefined) clearTimeout(timer);
        }
        if (reply.responded) {
          responsePending = false;
          const message = reply.response as ExtensionMessageResponse | undefined;
          const data = message?.data as Partial<DownloadDirectStatusResponse> | undefined;
          if (
            data?.requestId === requestId &&
            data.status === 'complete' &&
            message?.success === true
          )
            return;
          if (data?.requestId === requestId && data.status === 'active') activeObserved = true;
          if (message?.success === false && typeof message.error === 'string')
            lastError = message.error;
          if (
            data?.requestId === requestId &&
            (data.status === 'never-started' || data.status === 'interrupted')
          ) {
            throw new Error(lastError);
          }
        }
        const statusRemainingMs = deadline - performance.now();
        if (statusRemainingMs <= 0) break;
        let statusTimer: ReturnType<typeof setTimeout> | undefined;
        const statusTimeout = new Promise<undefined>((resolve) => {
          statusTimer = setTimeout(() => resolve(undefined), Math.min(1_000, statusRemainingMs));
        });
        let status: DownloadDirectStatusResponse | undefined;
        try {
          status = await (abortPromise
            ? Promise.race([inspect(), statusTimeout, abortPromise])
            : Promise.race([inspect(), statusTimeout]));
        } finally {
          if (statusTimer !== undefined) clearTimeout(statusTimer);
        }
        if (status?.status === 'complete') return;
        if (status?.status === 'never-started') throw new Error(lastError);
        if (status?.status === 'interrupted') throw new Error('Browser download was interrupted');
        if (status?.status === 'active') activeObserved = true;
      }
      // The worker may have lost its reply while the browser still owns the
      // transfer. Ask it to cancel the original ID before reporting uncertainty.
      if (activeObserved) sendCancelRequest(requestId, url);
      retainAbortListener = !signal?.aborted;
      if (retainAbortListener) handoffTimer = setTimeout(cleanupAbortListener, DOWNLOAD_TIMEOUT_MS);
      throw new Error(lastError);
    } finally {
      if (!retainAbortListener) cleanupAbortListener();
    }
  }
}
