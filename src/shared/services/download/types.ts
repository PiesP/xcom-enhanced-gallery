// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Shared download type definitions.
 */

import type { ErrorCode, MediaInfo } from '@shared/types/media.types';
import { computePercentage } from '@shared/utils/math/percentage';
import type { LiveByteBudget, OwnedBlob } from './live-byte-budget';

export interface OrchestratorItem {
  readonly url: string;
  readonly desiredName: string;
  readonly expectedSizeBytes?: number | undefined;
  readonly blob?: OwnedBlob | Promise<OwnedBlob> | undefined;
  readonly getBlob?:
    | ((signal?: AbortSignal, maxResponseBytes?: number) => Promise<OwnedBlob> | null)
    | undefined;
}

export type MediaBlobProvider = (
  media: MediaInfo,
  signal?: AbortSignal,
  maxResponseBytes?: number
) => Promise<OwnedBlob> | null;

export interface DownloadProgress {
  phase: string;
  current: number;
  total: number;
  percentage: number;
  filename?: string;
}

export type DownloadProgressCallback = (progress: DownloadProgress) => void;

export interface DownloadOptions {
  /** Shared binary ownership ledger; injectable for bounded acceptance fixtures. */
  liveBudget?: LiveByteBudget;
  concurrency?: number;
  retries?: number;
  signal?: AbortSignal;
  onProgress?: DownloadProgressCallback;
  zipFilename?: string;
  blob?: Blob;
  cachedBlobs?: Map<string, OwnedBlob | Promise<OwnedBlob>>;
  mediaBlobProvider?: MediaBlobProvider;
  /** Whole-file byte budget for workers waiting on ZIP serialization. */
  maxBufferedBytes?: number;
  /** Maximum accepted size for one ZIP entry. */
  maxEntryBytes?: number;
  /** Maximum serialized ZIP bytes, including stored-entry and directory overhead. */
  maxArchiveBytes?: number;
  /** Optional diagnostics hook used to expose retained whole-file bytes. */
  onBufferUsage?: (bufferedBytes: number) => void;
}

export interface SingleDownloadResult {
  success: boolean;
  filename?: string;
  error?: string;
  code?: ErrorCode;
}

export interface ZipResult {
  filesSuccessful: number;
  failures: Array<{ url: string; error: string }>;
  /** Parts ready for `new Blob(parts, {type:'application/zip'})` — no monolithic copy */
  zipData: BlobPart[];
  resourceLimitExceeded: boolean;
  /** Uses copy capacity already reserved before entries were read. Transfers ownership. */
  createBlob(): OwnedBlob;
  /** Drop parts and return reservations when no Blob was handed to a download. */
  dispose(): void;
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
