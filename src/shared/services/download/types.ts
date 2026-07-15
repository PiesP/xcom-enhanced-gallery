// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Shared download type definitions.
 */

import type { ErrorCode } from '@shared/types/media.types';
import { computePercentage } from '@shared/utils/math/percentage';

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

export interface ZipResult {
  filesSuccessful: number;
  failures: Array<{ url: string; error: string }>;
  /** Parts ready for `new Blob(parts, {type:'application/zip'})` — no monolithic copy */
  zipData: BlobPart[];
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

export function reportProgress(
  onProgress: DownloadOptions['onProgress'] | undefined,
  payload: Omit<DownloadProgress, 'percentage'> & { percentage?: number }
): void {
  if (!onProgress) return;
  const percentage = payload.percentage ?? computePercentage(payload.current, payload.total);
  onProgress({ ...payload, percentage });
}
