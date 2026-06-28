// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * MV3 extension download adapter.
 *
 * Relays download requests to the background service worker via chrome.runtime.sendMessage.
 * The SW handles chrome.downloads.download() which requires permissions unavailable
 * in content scripts directly.
 */

import { DOWNLOAD_TIMEOUT_MS } from '@constants/performance';
import type { DownloadAdapter } from './types';

interface MV3DownloadResponse {
  success: boolean;
  error?: string;
}

export class MV3DownloadAdapter implements DownloadAdapter {
  async download(url: string, filename: string, headers?: Record<string, string>): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('MV3 download request timed out'));
      }, DOWNLOAD_TIMEOUT_MS);

      chrome.runtime.sendMessage(
        {
          type: 'DOWNLOAD_REQUEST',
          payload: { url, filename, headers },
        },
        (response: MV3DownloadResponse) => {
          clearTimeout(timer);
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (response?.success) {
            resolve();
          } else {
            reject(new Error(response?.error ?? 'Download failed'));
          }
        }
      );
    });
  }

  async downloadBlob(blob: Blob, filename: string): Promise<void> {
    // For large blobs (>10MB), convert to ArrayBuffer and send as structured clone.
    // chrome.runtime.sendMessage supports structured clone (copy), though not transfer (zero-copy).
    // For very large files (>100MB), consider chunked messaging or offscreen document.
    const MAX_DATA_URL_SIZE = 10 * 1024 * 1024; // 10 MB

    if (blob.size <= MAX_DATA_URL_SIZE) {
      // Small blob: use data URL (simpler, works with all Chrome versions)
      const dataUrl = await this.blobToDataUrl(blob);
      return this.sendBlobDownload(dataUrl, filename);
    }

    // Large blob: convert to ArrayBuffer and send as structured clone
    const arrayBuffer = await blob.arrayBuffer();
    return this.sendBlobDownloadArrayBuffer(arrayBuffer, filename, blob.type);
  }

  private sendBlobDownload(dataUrl: string, filename: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('MV3 blob download request timed out'));
      }, DOWNLOAD_TIMEOUT_MS);

      chrome.runtime.sendMessage(
        {
          type: 'DOWNLOAD_BLOB_REQUEST',
          payload: { dataUrl, filename },
        },
        (response: MV3DownloadResponse) => {
          clearTimeout(timer);
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (response?.success) {
            resolve();
          } else {
            reject(new Error(response?.error ?? 'Blob download failed'));
          }
        }
      );
    });
  }

  private sendBlobDownloadArrayBuffer(
    buffer: ArrayBuffer,
    filename: string,
    mimeType: string
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('MV3 large blob download request timed out'));
      }, DOWNLOAD_TIMEOUT_MS);

      chrome.runtime.sendMessage(
        {
          type: 'DOWNLOAD_BLOB_ARRAYBUFFER_REQUEST',
          payload: { buffer, filename, mimeType },
        },
        (response: MV3DownloadResponse) => {
          clearTimeout(timer);
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (response?.success) {
            resolve();
          } else {
            reject(new Error(response?.error ?? 'Large blob download failed'));
          }
        }
      );
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
