/**
 * Shared download type definitions.
 */

import type { ErrorCode } from '@shared/types/result.types';

export interface OrchestratorItem {
  readonly url: string;
  readonly desiredName: string;
  readonly blob?: Blob | Promise<Blob> | undefined;
}

export interface DownloadProgress {
  phase: string;
  current: number;
  total: number;
  percentage: number;
  filename?: string;
}

export type DownloadProgressCallback = (progress: DownloadProgress) => void;

export interface OrchestratorOptions {
  concurrency?: number;
  retries?: number;
  signal?: AbortSignal;
  onProgress?: DownloadProgressCallback;
}

export interface DownloadOptions {
  concurrency?: number;
  retries?: number;
  signal?: AbortSignal;
  onProgress?: DownloadProgressCallback;
  zipFilename?: string;
  blob?: Blob;
  prefetchedBlobs?: Map<string, Blob | Promise<Blob>>;
}

export interface SingleDownloadResult {
  success: boolean;
  filename?: string;
  error?: string;
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
  onprogress?: (progress: { loaded: number; total: number }) => void;
  [key: string]: unknown;
}

export type GMDownloadFunction = (options: GMDownloadOptions) => void;

export interface DownloadCapability {
  hasGMDownload: boolean;
  method: 'gm_download' | 'none';
  gmDownload?: GMDownloadFunction | undefined;
}

export interface ZipResult {
  filesSuccessful: number;
  failures: Array<{ url: string; error: string }>;
  zipData: Uint8Array;
}

export interface BulkDownloadResult {
  success: boolean;
  status: 'success' | 'partial' | 'error';
  filesProcessed: number;
  filesSuccessful: number;
  filename?: string;
  error?: string;
  failures?: Array<{ url: string; error: string }>;
  code: ErrorCode;
}
