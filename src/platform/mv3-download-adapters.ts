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
 * - URL revocation for blob downloads is delayed to avoid a race condition
 *   where Chrome's download manager hasn't started reading the blob data
 *   before the object URL is revoked, resulting in 0-byte or corrupted files.
 * - Timeout is handled exclusively by the SW's waitForDownloadComplete.
 *   The adapter does not impose its own timeout — the SW's 5-minute timeout
 *   is the single point of timeout responsibility.
 */

import { BLOB_URL_REVOKE_DELAY_MS } from '@constants/performance';
import type {
  DownloadBlobUrlRequestMessage,
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

type DownloadMessage = DownloadRequestMessage | DownloadBlobUrlRequestMessage;

function sendCancelRequest(requestId: string): void {
  void browserApi.runtime
    .sendMessage({
      type: 'DOWNLOAD_CANCEL_REQUEST',
      payload: { requestId },
    })
    .catch(() => undefined);
}

export class MV3DownloadAdapter implements DownloadAdapter {
  /** MV3 background SW cannot download twimg.com URLs directly — needs content-script fetch */
  needsBlobFallback(): boolean {
    return true;
  }

  async download(
    url: string,
    filename: string,
    headers?: Record<string, string>,
    signal?: AbortSignal
  ): Promise<void> {
    await this.sendDownloadRequest(
      {
        type: 'DOWNLOAD_REQUEST',
        payload: { url, filename, ...(headers ? { headers } : {}) },
      },
      signal
    );
  }

  async downloadBlob(blob: Blob, filename: string, signal?: AbortSignal): Promise<void> {
    // URL.createObjectURL is unavailable in Service Workers — create in content script.
    // The object URL persists with the page lifetime, avoiding the SW termination
    // race condition that causes silent download failures with SW-created blob URLs.
    const objectUrl = URL.createObjectURL(blob);
    try {
      await this.sendDownloadRequest(
        {
          type: 'DOWNLOAD_BLOB_URL_REQUEST',
          payload: { objectUrl, filename, mimeType: blob.type },
        },
        signal
      );
    } finally {
      // Delay revocation to avoid a race condition where Chrome's download
      // manager hasn't started reading the blob before the URL is revoked.
      // A short delay after the SW confirms receipt gives Chrome time to
      // begin reading the blob data, preventing 0-byte or corrupted downloads.
      setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, BLOB_URL_REVOKE_DELAY_MS);
    }
  }

  private async sendDownloadRequest(message: DownloadMessage, signal?: AbortSignal): Promise<void> {
    const requestId = crypto.randomUUID();
    const request = {
      ...message,
      payload: { ...message.payload, requestId },
    } as DownloadMessage;

    let rejectAbort: ((reason: unknown) => void) | null = null;
    const abortPromise = signal
      ? new Promise<never>((_, reject) => {
          rejectAbort = reject;
        })
      : null;
    const onAbort = (): void => {
      sendCancelRequest(requestId);
      rejectAbort?.(getUserCancelledAbortErrorFromSignal(signal));
    };

    signal?.addEventListener('abort', onAbort, { once: true });
    try {
      if (signal?.aborted) {
        onAbort();
        await abortPromise;
        return;
      }

      const responsePromise = browserApi.runtime
        .sendMessage(request)
        .then((response) => response as ExtensionMessageResponse);
      const response = await (abortPromise
        ? Promise.race([responsePromise, abortPromise])
        : responsePromise);
      const error = unwrapResponse(response);
      if (error) throw new Error(error);
    } finally {
      signal?.removeEventListener('abort', onAbort);
    }
  }
}
