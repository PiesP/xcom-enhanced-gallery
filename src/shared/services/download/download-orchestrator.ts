// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/** @fileoverview Unified download service: single + bulk (ZIP) via GM_download. */

import { getDownloadAdapter } from '@platform/index';
import { mergeAbortSignals } from '@shared/async/abort-signal';
import { planBulkDownload } from '@shared/core/download/download-plan';
import { normalizeErrorMessage } from '@shared/error/app-error-reporter';
import { getUserCancelledAbortErrorFromSignal, isAbortError } from '@shared/error/cancellation';
import { downloadSingleFile } from '@shared/services/download/single-download';
import type {
  BulkDownloadResult,
  DownloadOptions,
  OrchestratorItem,
  SingleDownloadResult,
} from '@shared/services/download/types';
import { downloadAsZip } from '@shared/services/download/zip-download';
import { SingletonBase } from '@shared/services/singleton-base';
import type { MediaInfo } from '@shared/types/media.types';
import { ErrorCode } from '@shared/types/media.types';

let _downloadInstance: DownloadOrchestrator | null = null;

/**
 * Create a standardized error response for bulk download operations.
 * Provides a consistent error shape across all failure paths.
 */
function createErrorResponse(
  error: string,
  code: ErrorCode,
  filesProcessed: number,
  options?: { filesSuccessful?: number; failures?: BulkDownloadResult['failures'] }
): BulkDownloadResult {
  return {
    success: false,
    status: 'error',
    filesProcessed,
    filesSuccessful: options?.filesSuccessful ?? 0,
    error,
    ...(options?.failures ? { failures: options.failures } : {}),
    code,
  };
}

export class DownloadOrchestrator {
  private _initialized = false;
  private abortController = new AbortController();

  private constructor() {}

  public static getInstance(): DownloadOrchestrator {
    return SingletonBase.get(
      () => _downloadInstance,
      (inst) => {
        _downloadInstance = inst;
      },
      () => new DownloadOrchestrator()
    );
  }

  /**
   * Reset singleton instance (for testing only)
   * @internal
   */
  public static resetForTests(): void {
    SingletonBase.reset(
      () => _downloadInstance,
      (inst) => {
        _downloadInstance = inst;
      }
    );
  }

  /** Initialize service (idempotent) */
  public initialize(): void {
    // Recreate AbortController on re-initialization so that a previous
    // destroy() (which aborts the controller) does not leave a permanently
    // aborted signal that would cancel all downloads immediately.
    if (this.abortController.signal.aborted) {
      this.abortController = new AbortController();
    }
    this._initialized = true;
  }

  /** Destroy service (idempotent) — aborts all in-progress downloads */
  public destroy(): void {
    this.abortController.abort();
    this._initialized = false;
    SingletonBase.reset(
      () => _downloadInstance,
      (inst) => {
        _downloadInstance = inst;
      }
    );
  }

  public isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * The AbortSignal for all downloads managed by this orchestrator.
   * Destroyed via abort() when destroy() is called.
   */
  public get signal(): AbortSignal {
    return this.abortController.signal;
  }

  /**
   * Download a single media file
   *
   * @param media - Media info containing URL and metadata
   * @param options - Download options (signal, progress callback)
   * @returns Download result with success status
   */
  public async downloadSingle(
    media: MediaInfo,
    options: DownloadOptions = {}
  ): Promise<SingleDownloadResult> {
    const { signal: mergedSignal, cleanup } = this.mergeSignal(options.signal);
    try {
      return await downloadSingleFile(media, { ...options, signal: mergedSignal });
    } finally {
      cleanup();
    }
  }

  /**
   * Download multiple media files as a ZIP archive
   *
   * @param mediaItems - Array of media items to download
   * @param options - Download options including optional zipFilename
   * @returns Bulk download result with per-file status
   */
  public async downloadBulk(
    mediaItems: MediaInfo[],
    options: DownloadOptions = {}
  ): Promise<BulkDownloadResult> {
    const { signal: mergedSignal, cleanup } = this.mergeSignal(options.signal);

    try {
      if (mergedSignal.aborted) {
        const abortError = getUserCancelledAbortErrorFromSignal(mergedSignal);
        return createErrorResponse(normalizeErrorMessage(abortError), ErrorCode.CANCELLED, 0);
      }

      if (mediaItems.length === 0) {
        return createErrorResponse('No media to download', ErrorCode.EMPTY_INPUT, 0);
      }

      const adapter = getDownloadAdapter();
      if (!adapter) {
        return createErrorResponse('No download method', ErrorCode.ALL_FAILED, mediaItems.length);
      }

      const plan = planBulkDownload({
        mediaItems,
        prefetchedBlobs: options.prefetchedBlobs,
        zipFilename: options.zipFilename,
        nowMs: Date.now(),
      });

      const items: readonly OrchestratorItem[] = plan.items;

      try {
        const result = await downloadAsZip(items, { ...options, signal: mergedSignal });

        if (result.filesSuccessful === 0) {
          return createErrorResponse('No files downloaded', ErrorCode.ALL_FAILED, items.length, {
            failures: result.failures,
          });
        }

        // Uint8Array is a valid BlobPart; explicit cast required for TypeScript strict mode
        const zipBlob = new Blob([result.zipData as BlobPart], {
          type: 'application/zip',
        });
        const filename = plan.zipFilename;

        // Save ZIP using the download adapter
        const saveResult = await this.saveWithDownloadAdapter(
          zipBlob,
          filename,
          options.onProgress
        );

        if (!saveResult.success) {
          return createErrorResponse(
            saveResult.error || 'Failed to save ZIP file',
            ErrorCode.ALL_FAILED,
            items.length,
            { filesSuccessful: result.filesSuccessful, failures: result.failures }
          );
        }

        return {
          success: true,
          status: result.filesSuccessful === items.length ? 'success' : 'partial',
          filesProcessed: items.length,
          filesSuccessful: result.filesSuccessful,
          filename,
          failures: result.failures,
          code: ErrorCode.NONE,
        };
      } catch (error) {
        if (isAbortError(error)) {
          return createErrorResponse(
            normalizeErrorMessage(error),
            ErrorCode.CANCELLED,
            items.length
          );
        }

        return createErrorResponse(
          normalizeErrorMessage(error),
          ErrorCode.ALL_FAILED,
          items.length
        );
      }
    } finally {
      cleanup();
    }
  }

  /**
   * Returns the effective AbortSignal for downloads.
   * Combines the orchestrator's signal with the caller's signal (if any)
   * so that either aborting the orchestrator or the caller's signal cancels
   * the download. Falls back to just the orchestrator's signal when no
   * caller signal is provided.
   *
   * @returns An object with the merged signal and a cleanup function to
   * remove abort listeners from the input signals. Call cleanup() after
   * the download settles to prevent listener accumulation.
   */
  private mergeSignal(callerSignal?: AbortSignal | null): {
    signal: AbortSignal;
    cleanup: () => void;
  } {
    if (!callerSignal) return { signal: this.abortController.signal, cleanup: () => {} };
    return mergeAbortSignals(this.abortController.signal, callerSignal);
  }

  /**
   * Save blob using DownloadAdapter (relies to background SW or GM_download)
   * @internal
   */
  private async saveWithDownloadAdapter(
    blob: Blob,
    filename: string,
    _onprogress?: DownloadOptions['onProgress']
  ): Promise<{ success: boolean; error?: string }> {
    const adapter = getDownloadAdapter();
    try {
      await adapter.downloadBlob(blob, filename);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: normalizeErrorMessage(error),
      };
    }
  }
}
