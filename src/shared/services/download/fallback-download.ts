/**
 * @fileoverview Fallback Download Implementation
 * @description Provides fetch + blob + anchor download for environments without GM_download
 * (e.g., Violentmonkey, Greasemonkey, or browser-only contexts)
 */

import { getErrorMessage } from '@shared/error/utils';
import { logger } from '@shared/logging';
import type { DownloadProgress } from './types';

type GlobalWithGMDownload = typeof globalThis & {
  readonly GM_download?: unknown;
};

export interface GMDownloadProgressEvent {
  loaded: number;
  total: number;
}

export interface GMDownloadOptions {
  url: string;
  name: string;
  headers?: Record<string, string>;
  timeout?: number;
  saveAs?: boolean;
  onload: () => void;
  onerror: (error: unknown) => void;
  ontimeout: () => void;
  onprogress?: (progress: GMDownloadProgressEvent) => void;
  [key: string]: unknown;
}

export type GMDownloadFunction = (options: GMDownloadOptions) => void;

/**
 * Download capability detection result
 */
export interface DownloadCapability {
  /** Whether GM_download is available */
  hasGMDownload: boolean;
  /** Whether fetch API is available */
  hasFetch: boolean;
  /** Whether Blob/URL.createObjectURL is available */
  hasBlob: boolean;
  /** Recommended download method */
  method: 'gm_download' | 'fetch_blob' | 'none';
  /** Reference to GM_download when available */
  gmDownload?: GMDownloadFunction | undefined;
}

/**
 * Detect available download capabilities
 */
export function detectDownloadCapability(): DownloadCapability {
  const gmDownload = resolveGMDownload();
  const hasGMDownload = typeof gmDownload === 'function';

  const hasFetch = typeof fetch === 'function';

  const hasBlob =
    typeof Blob !== 'undefined' &&
    typeof URL !== 'undefined' &&
    typeof URL.createObjectURL === 'function';

  let method: DownloadCapability['method'] = 'none';
  if (hasGMDownload) {
    method = 'gm_download';
  } else if (hasFetch && hasBlob) {
    method = 'fetch_blob';
  }

  return { hasGMDownload, hasFetch, hasBlob, method, gmDownload };
}

function resolveGMDownload(): GMDownloadFunction | undefined {
  if (typeof GM_download !== 'undefined' && typeof GM_download === 'function') {
    return GM_download as unknown as GMDownloadFunction;
  }

  const globalObject = globalThis as GlobalWithGMDownload;
  const fromGlobal = globalObject.GM_download;
  if (typeof fromGlobal === 'function') {
    return fromGlobal as unknown as GMDownloadFunction;
  }

  return undefined;
}

/**
 * Fallback download options
 */
export interface FallbackDownloadOptions {
  /** Abort signal for cancellation */
  signal?: AbortSignal | undefined;
  /** Progress callback */
  onProgress?: ((progress: DownloadProgress) => void) | undefined;
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number | undefined;
}

/**
 * Fallback download result
 */
export interface FallbackDownloadResult {
  success: boolean;
  filename?: string;
  error?: string;
}

/**
 * Download file using fetch + blob + anchor (fallback method)
 * Works in Violentmonkey and standard browser contexts
 *
 * @param url - URL to download
 * @param filename - Desired filename
 * @param options - Download options
 * @returns Download result
 */
export async function downloadWithFetchBlob(
  url: string,
  filename: string,
  options: FallbackDownloadOptions = {}
): Promise<FallbackDownloadResult> {
  const { signal, onProgress, timeout = 30000 } = options;

  if (signal?.aborted) {
    return { success: false, error: 'Download cancelled' };
  }

  // Report preparing phase
  onProgress?.({
    phase: 'preparing',
    current: 0,
    total: 1,
    percentage: 0,
    filename,
  });

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Combine with external signal if provided
    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    // Fetch the resource
    const response = await fetch(url, {
      signal: controller.signal,
      mode: 'cors',
      credentials: 'omit',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    // Get content length for progress tracking
    const contentLength = response.headers.get('content-length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

    // Read response with progress tracking
    let blob: Blob;

    if (totalBytes > 0 && response.body) {
      // Stream-based reading with progress
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let receivedBytes = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        if (value) {
          chunks.push(value);
          receivedBytes += value.length;

          onProgress?.({
            phase: 'downloading',
            current: 0,
            total: 1,
            percentage: Math.round((receivedBytes / totalBytes) * 100),
            filename,
          });
        }
      }

      // Combine chunks into blob
      blob = new Blob(chunks as BlobPart[], {
        type: response.headers.get('content-type') || 'application/octet-stream',
      });
    } else {
      // Fallback: read entire response at once (no progress tracking)
      blob = await response.blob();
    }

    // Create object URL and trigger download
    const blobUrl = URL.createObjectURL(blob);

    try {
      await triggerAnchorDownload(blobUrl, filename);

      onProgress?.({
        phase: 'complete',
        current: 1,
        total: 1,
        percentage: 100,
        filename,
      });

      logger.debug(`[FallbackDownload] Download complete: ${filename}`);
      return { success: true, filename };
    } finally {
      // Clean up blob URL
      URL.revokeObjectURL(blobUrl);
    }
  } catch (error) {
    const errorMsg = getErrorMessage(error);

    if (errorMsg.includes('abort') || errorMsg.includes('cancel')) {
      return { success: false, error: 'Download cancelled' };
    }

    logger.error('[FallbackDownload] Download failed:', error);

    onProgress?.({
      phase: 'complete',
      current: 1,
      total: 1,
      percentage: 0,
      filename,
    });

    return { success: false, error: errorMsg };
  }
}

/**
 * Trigger download using anchor element click
 *
 * @param url - Blob URL or data URL
 * @param filename - Desired filename
 */
async function triggerAnchorDownload(url: string, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.style.display = 'none';

      // Append to body for Firefox compatibility
      document.body.appendChild(anchor);

      // Trigger click
      anchor.click();

      // Clean up after a short delay
      setTimeout(() => {
        document.body.removeChild(anchor);
        resolve();
      }, 100);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Download blob directly using anchor element
 * Used when blob is already available (e.g., from prefetch cache)
 *
 * @param blob - Blob to download
 * @param filename - Desired filename
 * @param options - Download options
 * @returns Download result
 */
export async function downloadBlobWithAnchor(
  blob: Blob,
  filename: string,
  options: FallbackDownloadOptions = {}
): Promise<FallbackDownloadResult> {
  const { onProgress } = options;

  onProgress?.({
    phase: 'preparing',
    current: 0,
    total: 1,
    percentage: 0,
    filename,
  });

  const blobUrl = URL.createObjectURL(blob);

  try {
    await triggerAnchorDownload(blobUrl, filename);

    onProgress?.({
      phase: 'complete',
      current: 1,
      total: 1,
      percentage: 100,
      filename,
    });

    logger.debug(`[FallbackDownload] Blob download complete: ${filename}`);
    return { success: true, filename };
  } catch (error) {
    const errorMsg = getErrorMessage(error);
    logger.error('[FallbackDownload] Blob download failed:', error);

    onProgress?.({
      phase: 'complete',
      current: 1,
      total: 1,
      percentage: 0,
      filename,
    });

    return { success: false, error: errorMsg };
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}
