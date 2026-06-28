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
    const response = (await this.sendMessageWithTimeout({
      type: 'DOWNLOAD_REQUEST',
      payload: { url, filename, headers },
    })) as MV3DownloadResponse;
    if (!response?.success) {
      throw new Error(response?.error ?? 'Download failed');
    }
  }

  async downloadBlob(blob: Blob, filename: string): Promise<void> {
    // For large blobs (>10MB), convert to ArrayBuffer and send as structured clone.
    // chrome.runtime.sendMessage supports structured clone (copy), though not transfer (zero-copy).
    // For very large files (>100MB), consider chunked messaging or offscreen document.
    const MAX_DATA_URL_SIZE = 10 * 1024 * 1024; // 10 MB

    if (blob.size <= MAX_DATA_URL_SIZE) {
      // Small blob: use data URL (simpler, works with all Chrome versions)
      const dataUrl = await this.blobToDataUrl(blob);
      const response = (await this.sendMessageWithTimeout({
        type: 'DOWNLOAD_BLOB_REQUEST',
        payload: { dataUrl, filename },
      })) as MV3DownloadResponse;
      if (!response?.success) {
        throw new Error(response?.error ?? 'Blob download failed');
      }
      return;
    }

    // Large blob: convert to ArrayBuffer and send as structured clone
    const arrayBuffer = await blob.arrayBuffer();
    const response = (await this.sendMessageWithTimeout({
      type: 'DOWNLOAD_BLOB_ARRAYBUFFER_REQUEST',
      payload: { buffer: arrayBuffer, filename, mimeType: blob.type },
    })) as MV3DownloadResponse;
    if (!response?.success) {
      throw new Error(response?.error ?? 'Large blob download failed');
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

  private blobToDataUrl(blob: Blob): Promise<string> {
    // Guard against OOM on very large blobs (>10MB).
    // FileReader.readAsDataURL loads the entire blob into memory as base64.
    const MAX_BLOB_SIZE = 10 * 1024 * 1024; // 10 MB
    if (blob.size > MAX_BLOB_SIZE) {
      return Promise.reject(
        new Error(
          `Blob too large for data URL conversion: ${blob.size} bytes (max ${MAX_BLOB_SIZE})`
        )
      );
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read blob'));
      reader.readAsDataURL(blob);
    });
  }
}
