/**
 * Download Service Type Definitions
 * @module @shared/services/download/types
 */

import type { ErrorCode } from '@shared/types/result.types';

/** Download progress phases */
export interface DownloadProgress {
  /** Current phase: preparing | downloading | complete */
  phase: 'preparing' | 'downloading' | 'complete';
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
  url: string;
  /** Desired filename */
  desiredName: string;
  /** Pre-fetched Blob data */
  blob?: Blob | Promise<Blob> | undefined;
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
  failures: Array<{ url: string; error: string }>;
  /** Raw ZIP bytes */
  zipData: Uint8Array;
  /** Filenames in completion order */
  usedFilenames: string[];
}

/** Download data source type */
export type DownloadDataSource = 'dom' | 'cache' | 'network';

/** Single item download result with source */
export interface SingleItemDownloadResult {
  data: Uint8Array;
  source: DownloadDataSource;
}

/** Bulk download operation result */
export interface BulkDownloadResult {
  success: boolean;
  /** success | partial | error */
  status: 'success' | 'partial' | 'error';
  filesProcessed: number;
  filesSuccessful: number;
  filename?: string;
  error?: string;
  failures?: Array<{ url: string; error: string }>;
  code: ErrorCode;
}
