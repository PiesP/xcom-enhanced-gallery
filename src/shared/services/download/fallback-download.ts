/**
 * @fileoverview GM_download capability detection.
 * @description Keeps the download surface minimal by dropping fetch+blob fallbacks.
 */

import { isGMAPIAvailable, resolveGMDownload } from '@shared/external/userscript';

interface GMDownloadProgressEvent {
  loaded: number;
  total: number;
}

interface GMDownloadOptions {
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

export interface DownloadCapability {
  hasGMDownload: boolean;
  method: 'gm_download' | 'none';
  gmDownload?: GMDownloadFunction | undefined;
}

export function detectDownloadCapability(): DownloadCapability {
  const rawGMDownload = resolveGMDownload();
  const gmDownload =
    typeof rawGMDownload === 'function'
      ? (rawGMDownload as unknown as GMDownloadFunction)
      : undefined;
  const hasGMDownload = isGMAPIAvailable('download') && !!gmDownload;

  return {
    hasGMDownload,
    method: hasGMDownload ? 'gm_download' : 'none',
    gmDownload,
  };
}
