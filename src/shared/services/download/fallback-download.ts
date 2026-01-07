/**
 * @fileoverview GM_download capability detection.
 * @description Keeps the download surface minimal by dropping fetch+blob fallbacks.
 */

import { resolveGMDownload } from '@shared/external/userscript/adapter';
import { isGMAPIAvailable } from '@shared/external/userscript/environment-detector';

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

function asGMDownloadFunction(value: unknown): GMDownloadFunction | undefined {
  return typeof value === 'function' ? (value as GMDownloadFunction) : undefined;
}

export function detectDownloadCapability(): DownloadCapability {
  const gmDownload = asGMDownloadFunction(resolveGMDownload());
  const hasGMDownload = !!gmDownload && isGMAPIAvailable('download');

  return {
    hasGMDownload,
    method: hasGMDownload ? 'gm_download' : 'none',
    gmDownload: hasGMDownload ? gmDownload : undefined,
  };
}
