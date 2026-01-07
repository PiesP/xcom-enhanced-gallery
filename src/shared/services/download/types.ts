/**
 * Download Service Type Definitions
 * @module @shared/services/download/types
 */

import type { ErrorCode } from '@shared/types/result.types';

/** Download progress phases */
type DownloadPhase = 'preparing' | 'downloading' | 'complete';

/** Bulk download result status */
type BulkDownloadStatus = 'success' | 'partial' | 'error';

/** Failed download metadata */
type DownloadFailure = {
  url: string;
  error: string;
};

/** Download progress payload */
interface DownloadProgress {
  /** Current phase: preparing | downloading | complete */
  phase: DownloadPhase;
  /** Number of completed items (0 to total) */
  current: number;
  /** Total items to download */
  total: number;
  /** Progress percentage (0-100) */
  percentage: number;
  /** Currently downloading filename (optional) */
  filename?: string;
}

/** Item to be processed by orchestrator */
export interface OrchestratorItem {
  /** Download URL */
  readonly url: string;
  /** Desired filename */
  readonly desiredName: string;
  /** Pre-fetched Blob data */
  readonly blob?: Blob | Promise<Blob> | undefined;
}

/** Orchestrator configuration options */
export interface OrchestratorOptions {
  /** Max concurrent downloads (1-8, default: 4) */
  concurrency?: number;
  /** Retry attempts on failure (default: 3) */
  retries?: number;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Progress callback */
  onProgress?: (progress: DownloadProgress) => void;
}

/** Extended download options with ZIP configuration */
export interface DownloadOptions extends OrchestratorOptions {
  /** Custom ZIP filename */
  zipFilename?: string;
  /** Direct Blob data */
  blob?: Blob;
  /** Pre-fetched Blobs map */
  prefetchedBlobs?: Map<string, Blob | Promise<Blob>>;
}

/** Single download operation result */
export interface SingleDownloadResult {
  success: boolean;
  filename?: string;
  error?: string;
}

/** ZIP operation result */
export interface ZipResult {
  /** Successfully added files count */
  filesSuccessful: number;
  /** Failed downloads */
  failures: Array<DownloadFailure>;
  /** Raw ZIP bytes */
  zipData: Uint8Array;
}

/** Bulk download operation result */
export interface BulkDownloadResult {
  success: boolean;
  /** success | partial | error */
  status: BulkDownloadStatus;
  filesProcessed: number;
  filesSuccessful: number;
  filename?: string;
  error?: string;
  failures?: Array<DownloadFailure>;
  code: ErrorCode;
}
