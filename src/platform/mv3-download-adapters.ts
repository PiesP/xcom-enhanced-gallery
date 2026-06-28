// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * MV3 extension download adapter.
 *
 * Relays download requests to the background service worker via
 * chrome.runtime.sendMessage (Promise-based, not callback-based).
 * The SW handles chrome.downloads.download() which requires permissions
 * unavailable in content scripts directly.
 *
 * Note: MV3 requires Promise-based sendMessage. The callback pattern
 * (3rd argument) does not work reliably when the receiver responds
 * asynchronously (sendResponse called inside a .then()).
 */

import { DOWNLOAD_TIMEOUT_MS } from '@constants/performance';
import type { DownloadAdapter } from './types';

interface MV3DownloadResponse {
  success: boolean;
  error?: string;
}

export class MV3DownloadAdapter implements DownloadAdapter {
  async download(url: string, filename: string, headers?: Record<string, string>): Promise<void> {
    console.log('[XEG:Download] DOWNLOAD_REQUEST -> SW', { url: url.slice(0, 80), filename });
    try {
      const response = (await this.sendMessageWithTimeout({
        type: 'DOWNLOAD_REQUEST',
        payload: { url, filename, headers },
      })) as MV3DownloadResponse;
      if (!response?.success) {
        console.error('[XEG:Download] DOWNLOAD_REQUEST failed:', response?.error);
        throw new Error(response?.error ?? 'Download failed');
      }
      console.log('[XEG:Download] DOWNLOAD_REQUEST success');
    } catch (error) {
      console.error('[XEG:Download] DOWNLOAD_REQUEST error:', (error as Error).message);
      throw error;
    }
  }

  async downloadBlob(blob: Blob, filename: string): Promise<void> {
    // Service Worker has no URL.createObjectURL, so create object URL
    // in content script context and pass it to SW for download.
    console.log('[XEG:Download] downloadBlob:', { size: blob.size, filename });

    const objectUrl = URL.createObjectURL(blob);
    console.log('[XEG:Download] objectUrl created:', objectUrl);

    try {
      const response = (await this.sendMessageWithTimeout({
        type: 'DOWNLOAD_BLOB_URL_REQUEST',
        payload: { objectUrl, filename },
      })) as MV3DownloadResponse;
      if (!response?.success) {
        console.error('[XEG:Download] DOWNLOAD_BLOB_URL_REQUEST failed:', response?.error);
        throw new Error(response?.error ?? 'Blob download failed');
      }
      console.log('[XEG:Download] DOWNLOAD_BLOB_URL_REQUEST success');
    } catch (error) {
      console.error('[XEG:Download] DOWNLOAD_BLOB_URL_REQUEST error:', (error as Error).message);
      throw error;
    } finally {
      // Revoke the object URL after download completes (or fails).
      URL.revokeObjectURL(objectUrl);
    }
  }

  private sendMessageWithTimeout(message: unknown): Promise<unknown> {
    return new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('MV3 message request timed out'));
      }, DOWNLOAD_TIMEOUT_MS);

      console.log('[XEG:Download] sendMessage:', (message as { type: string }).type);
      chrome.runtime
        .sendMessage(message)
        .then((response: unknown) => {
          clearTimeout(timer);
          console.log(
            '[XEG:Download] sendMessage response:',
            (message as { type: string }).type,
            '->',
            JSON.stringify(response)
          );
          resolve(response);
        })
        .catch((error: unknown) => {
          clearTimeout(timer);
          console.error(
            '[XEG:Download] sendMessage error:',
            (message as { type: string }).type,
            '->',
            (error as Error).message
          );
          reject(error instanceof Error ? error : new Error(String(error)));
        });
    });
  }
}
