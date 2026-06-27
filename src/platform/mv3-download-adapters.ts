// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * MV3 extension download adapter.
 *
 * Relays download requests to the background service worker via chrome.runtime.sendMessage.
 * The SW handles chrome.downloads.download() which requires permissions unavailable
 * in content scripts directly.
 */

import type { DownloadAdapter } from './types';

const MV3_DOWNLOAD_TIMEOUT_MS = 30000;

interface MV3DownloadResponse {
  success: boolean;
  error?: string;
}

export class MV3DownloadAdapter implements DownloadAdapter {
  async download(url: string, filename: string, headers?: Record<string, string>): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('MV3 download request timed out'));
      }, MV3_DOWNLOAD_TIMEOUT_MS);

      chrome.runtime.sendMessage(
        undefined,
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
    const dataUrl = await this.blobToDataUrl(blob);
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('MV3 blob download request timed out'));
      }, MV3_DOWNLOAD_TIMEOUT_MS);

      chrome.runtime.sendMessage(
        undefined,
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
