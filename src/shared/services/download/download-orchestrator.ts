// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/** @fileoverview Unified download service: single + bulk (ZIP) via GM_download. */

import { planBulkDownload } from '@shared/core/download/download-plan';
import { normalizeErrorMessage } from '@shared/error/app-error-reporter';
import { getUserCancelledAbortErrorFromSignal, isAbortError } from '@shared/error/cancellation';
import type { DownloadProvider } from '@shared/services/download/download-provider.contract';
import {
  detectDownloadCapability,
  downloadSingleFile,
  GMDownloadProvider,
} from '@shared/services/download/single-download';
import type {
  BulkDownloadResult,
  DownloadCapability,
  DownloadOptions,
  GMDownloadFunction,
  OrchestratorItem,
  SingleDownloadResult,
} from '@shared/services/download/types';
import { downloadAsZip } from '@shared/services/download/zip-download';
import type { MediaInfo } from '@shared/types/media.types';
import { ErrorCode } from '@shared/types/media.types';

let _downloadInstance: DownloadOrchestrator | null = null;

export class DownloadOrchestrator {
  private capability: DownloadCapability | null = null;
  private _initialized = false;
  private providers: DownloadProvider[] = [new GMDownloadProvider()];

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
  public initialize(): void {
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
   * Register a new download provider. Later providers take priority
   * (last registered is tried first).
   */
  public registerProvider(provider: DownloadProvider): void {
    this.providers.push(provider);
  }

  /**
   * Find the first available provider (tries last-registered first).
   * @internal - Will be used in Phase 3 when orchestrator adopts provider pattern.
   */
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: scaffolding for Phase 3
  // @ts-expect-error TS6133 - scaffolding for Phase 3 when orchestrator adopts provider pattern
  private resolveProvider(): DownloadProvider | null {
    for (let i = this.providers.length - 1; i >= 0; i--) {
      const provider: DownloadProvider | undefined = this.providers[i];
      if (provider?.detect()) return provider;
    }
    return null;
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
        error: normalizeErrorMessage(abortError),
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
          error: normalizeErrorMessage(error),
          code: ErrorCode.CANCELLED,
        };
      }

      return {
        success: false,
        status: 'error',
        filesProcessed: items.length,
        filesSuccessful: 0,
        error: normalizeErrorMessage(error),
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
    options: DownloadOptions,
    capability: DownloadCapability
  ): Promise<{ success: boolean; error?: string }> {
    if (capability.method === 'gm_download' && capability.gmDownload) {
      return this.saveWithGMDownload(capability.gmDownload, zipBlob, filename, options.onProgress);
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
    filename: string,
    onprogress?: DownloadOptions['onProgress']
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
          ...(onprogress
            ? {
                onprogress: (progress: { loaded: number; total: number }) => {
                  if (progress.total <= 0) return;
                  const pct = Math.min(
                    100,
                    Math.max(0, Math.round((progress.loaded / progress.total) * 100))
                  );
                  onprogress({
                    phase: 'saving',
                    current: progress.loaded,
                    total: progress.total,
                    percentage: pct,
                    filename,
                  });
                },
              }
            : {}),
        });
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: normalizeErrorMessage(error),
      };
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}
