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
import type { ExtensionMessageResponse } from '../extension/extension-message-types';
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

export class MV3DownloadAdapter implements DownloadAdapter {
  /** MV3 background SW cannot download twimg.com URLs directly — needs content-script fetch */
  needsBlobFallback(): boolean {
    return true;
  }

  async download(url: string, filename: string, headers?: Record<string, string>): Promise<void> {
    const response = (await browserApi.runtime.sendMessage({
      type: 'DOWNLOAD_REQUEST',
      payload: { url, filename, headers },
    })) as ExtensionMessageResponse;
    const error = unwrapResponse(response);
    if (error) {
      throw new Error(error);
    }
  }

  async downloadBlob(blob: Blob, filename: string): Promise<void> {
    // URL.createObjectURL is unavailable in Service Workers — create in content script.
    const objectUrl = URL.createObjectURL(blob);
    try {
      const response = (await browserApi.runtime.sendMessage({
        type: 'DOWNLOAD_BLOB_URL_REQUEST',
        payload: { objectUrl, filename },
      })) as ExtensionMessageResponse;
      const error = unwrapResponse(response);
      if (error) {
        throw new Error(error);
      }
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
}
