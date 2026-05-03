/**
 * @fileoverview Download Orchestrator - Unified Download Service
 * @description Orchestrates single and bulk downloads using GM_download when available.
 *
 * **Architecture**:
 * - Single downloads: Delegates to downloadSingleFile (handles strategy internally)
 * - Bulk downloads: Creates ZIP via downloadAsZip, saves via detected method
 *
 * **Download Strategies**:
 * - GM_download: Tampermonkey native (preferred, better UX)
 *
 */

import { planBulkDownload, planZipSave } from '@shared/core/download/download-plan';
import { getUserCancelledAbortErrorFromSignal, isAbortError } from '@shared/error/cancellation';
import { getErrorMessage } from '@shared/error/normalize';
import {
  type DownloadCapability,
  type DownloadOptions,
  detectDownloadCapability,
  downloadSingleFile,
  type GMDownloadFunction,
  type SingleDownloadResult,
} from '@shared/services/download/single-download';
import type { OrchestratorItem } from '@shared/services/download/types';
import { type BulkDownloadResult, downloadAsZip } from '@shared/services/download/zip-download';
import type { MediaInfo } from '@shared/types/media.types';
import { ErrorCode } from '@shared/types/result.types';

let _downloadInstance: DownloadOrchestrator | null = null;

/**
 * DownloadOrchestrator - Central download service
 *
 * Singleton service that handles all media downloads.
 * Automatically selects the best download method based on environment.
 *
 * @example
 * ```typescript
 * const orchestrator = DownloadOrchestrator.getInstance();
 *
 * // Single download
 * await orchestrator.downloadSingle(mediaInfo);
 *
 * // Bulk download as ZIP
 * await orchestrator.downloadBulk(mediaItems, { zipFilename: 'gallery.zip' });
 * ```
 */
export class DownloadOrchestrator {
  /** Cached download capability detection (lazy initialized) */
  private capability: DownloadCapability | null = null;
  private _initialized = false;

  private constructor() {}

  public static getInstance(): DownloadOrchestrator {
    if (!_downloadInstance) _downloadInstance = new DownloadOrchestrator();
    return _downloadInstance;
  }

  /**
   * Reset singleton instance (for testing only)
   * @internal
   */
  public static resetForTests(): void {
    _downloadInstance = null;
  }

  /** Initialize service (idempotent) */
  public async initialize(): Promise<void> {
    this._initialized = true;
  }

  /** Destroy service (idempotent) */
  public destroy(): void {
    this.capability = null;
    this._initialized = false;
  }

  /** Check if service is initialized */
  public isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * Get download capability (cached)
   */
  private getCapability(): DownloadCapability {
    return (this.capability ??= detectDownloadCapability());
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
    const capability = this.getCapability();
    return downloadSingleFile(media, options, capability);
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
    if (options.signal?.aborted) {
      const abortError = getUserCancelledAbortErrorFromSignal(options.signal);
      return {
        success: false,
        status: 'error',
        filesProcessed: 0,
        filesSuccessful: 0,
        error: getErrorMessage(abortError) || 'Download cancelled',
        code: ErrorCode.CANCELLED,
      };
    }

    if (mediaItems.length === 0) {
      return {
        success: false,
        status: 'error',
        filesProcessed: 0,
        filesSuccessful: 0,
        error: 'No media to download',
        code: ErrorCode.EMPTY_INPUT,
      };
    }

    const capability = this.getCapability();

    if (capability.method === 'none') {
      return {
        success: false,
        status: 'error',
        filesProcessed: mediaItems.length,
        filesSuccessful: 0,
        error: 'No download method',
        code: ErrorCode.ALL_FAILED,
      };
    }

    const plan = planBulkDownload({
      mediaItems,
      prefetchedBlobs: options.prefetchedBlobs,
      zipFilename: options.zipFilename,
      nowMs: Date.now(),
    });

    const items: readonly OrchestratorItem[] = plan.items;

    try {
      const result = await downloadAsZip(items, options);

      if (result.filesSuccessful === 0) {
        return {
          success: false,
          status: 'error',
          filesProcessed: items.length,
          filesSuccessful: 0,
          error: 'No files downloaded',
          failures: result.failures,
          code: ErrorCode.ALL_FAILED,
        };
      }

      // Uint8Array is a valid BlobPart; explicit cast required for TypeScript strict mode
      const zipBlob = new Blob([result.zipData as BlobPart], {
        type: 'application/zip',
      });
      const filename = plan.zipFilename;

      // Save ZIP using appropriate download method
      const saveResult = await this.saveZipBlob(zipBlob, filename, options, capability);

      if (!saveResult.success) {
        return {
          success: false,
          status: 'error',
          filesProcessed: items.length,
          filesSuccessful: result.filesSuccessful,
          error: saveResult.error || 'Failed to save ZIP file',
          failures: result.failures,
          code: ErrorCode.ALL_FAILED,
        };
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
        return {
          success: false,
          status: 'error',
          filesProcessed: items.length,
          filesSuccessful: 0,
          error: getErrorMessage(error) || 'Download cancelled',
          code: ErrorCode.CANCELLED,
        };
      }

      return {
        success: false,
        status: 'error',
        filesProcessed: items.length,
        filesSuccessful: 0,
        error: getErrorMessage(error) || 'Unknown error',
        code: ErrorCode.ALL_FAILED,
      };
    }
  }

  /**
   * Save ZIP blob using the detected download method
   * @internal
   */
  private async saveZipBlob(
    zipBlob: Blob,
    filename: string,
    _options: DownloadOptions,
    capability: DownloadCapability
  ): Promise<{ success: boolean; error?: string }> {
    const saveStrategy = planZipSave(capability.method);

    if (saveStrategy === 'gm_download' && capability.gmDownload) {
      return this.saveWithGMDownload(capability.gmDownload, zipBlob, filename);
    }

    return { success: false, error: 'No download method' };
  }

  /**
   * Save blob using GM_download
   * @internal
   */
  private async saveWithGMDownload(
    gmDownload: GMDownloadFunction,
    blob: Blob,
    filename: string
  ): Promise<{ success: boolean; error?: string }> {
    const url = URL.createObjectURL(blob);
    try {
      await new Promise<void>((resolve, reject) => {
        gmDownload({
          url,
          name: filename,
          onload: () => resolve(),
          onerror: (err: unknown) => reject(err),
          ontimeout: () => reject(new Error('Timeout')),
        });
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error) || 'GM_download failed',
      };
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}
