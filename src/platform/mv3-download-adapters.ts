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
 */

import { DOWNLOAD_TIMEOUT_MS } from '@constants/performance';
import type { DownloadAdapter } from './types';

interface MV3DownloadResponse {
  success: boolean;
  error?: string;
}

export class MV3DownloadAdapter implements DownloadAdapter {
  async download(url: string, filename: string, headers?: Record<string, string>): Promise<void> {
    const response = (await this.sendMessageWithTimeout({
      type: 'DOWNLOAD_REQUEST',
      payload: { url, filename, headers },
    })) as MV3DownloadResponse;
    if (!response?.success) {
      throw new Error(response?.error ?? 'Download failed');
    }
  }

  async downloadBlob(blob: Blob, filename: string): Promise<void> {
    // URL.createObjectURL is unavailable in Service Workers — create in content script.
    const objectUrl = URL.createObjectURL(blob);
    try {
      const response = (await this.sendMessageWithTimeout({
        type: 'DOWNLOAD_BLOB_URL_REQUEST',
        payload: { objectUrl, filename },
      })) as MV3DownloadResponse;
      if (!response?.success) {
        throw new Error(response?.error ?? 'Blob download failed');
      }
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  private sendMessageWithTimeout(message: unknown): Promise<unknown> {
    return new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('MV3 message request timed out'));
      }, DOWNLOAD_TIMEOUT_MS);

      chrome.runtime
        .sendMessage(message)
        .then((response: unknown) => {
          clearTimeout(timer);
          resolve(response);
        })
        .catch((error: unknown) => {
          clearTimeout(timer);
          reject(error instanceof Error ? error : new Error(String(error)));
        });
    });
  }
}
