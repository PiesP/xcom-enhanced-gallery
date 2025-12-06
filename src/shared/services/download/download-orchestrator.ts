/**
 * @fileoverview Download Orchestrator - Unified Download Service
 * @description Orchestrates single and bulk downloads using appropriate strategy
 *              based on available capabilities (GM_download vs fetch+blob).
 *
 * **Architecture**:
 * - Single downloads: Delegates to downloadSingleFile (handles strategy internally)
 * - Bulk downloads: Creates ZIP via downloadAsZip, saves via detected method
 *
 * **Download Strategies**:
 * - GM_download: Tampermonkey native (preferred, better UX)
 * - fetch+blob: Violentmonkey/browser fallback (anchor download)
 *
 * @version 2.0.0 - Phase 500: Enhanced documentation
 */

import { logger } from '@shared/logging';
import { BaseServiceImpl } from '@shared/services/base-service';
import {
  type DownloadCapability,
  detectDownloadCapability,
  downloadBlobWithAnchor,
  type GMDownloadFunction,
} from '@shared/services/download/fallback-download';
import { downloadSingleFile } from '@shared/services/download/single-download';
import type {
  BulkDownloadResult,
  DownloadOptions,
  OrchestratorItem,
  SingleDownloadResult,
} from '@shared/services/download/types';
import { downloadAsZip } from '@shared/services/download/zip-download';
import { generateMediaFilename, generateZipFilename } from '@shared/services/filename';
import type { MediaInfo } from '@shared/types/media.types';
import { ErrorCode } from '@shared/types/result.types';

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
export class DownloadOrchestrator extends BaseServiceImpl {
  private static instance: DownloadOrchestrator | null = null;

  /** Cached download capability detection (lazy initialized) */
  private capability: DownloadCapability | null = null;

  private constructor() {
    super('DownloadOrchestrator');
  }

  public static getInstance(): DownloadOrchestrator {
    if (!DownloadOrchestrator.instance) {
      DownloadOrchestrator.instance = new DownloadOrchestrator();
    }
    return DownloadOrchestrator.instance;
  }

  /**
   * Reset singleton instance (for testing only)
   * @internal
   */
  public static resetInstance(): void {
    DownloadOrchestrator.instance = null;
  }

  protected async onInitialize(): Promise<void> {
    // Capability is lazily detected on first use
    logger.debug('[DownloadOrchestrator] Initialized');
  }

  protected onDestroy(): void {
    this.capability = null;
  }

  /**
   * Get download capability (cached)
   */
  private getCapability(): DownloadCapability {
    if (!this.capability) {
      this.capability = detectDownloadCapability();
    }
    return this.capability;
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
    options: DownloadOptions = {},
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
    options: DownloadOptions = {},
  ): Promise<BulkDownloadResult> {
    const items: OrchestratorItem[] = mediaItems.map((media) => ({
      url: media.url,
      desiredName: generateMediaFilename(media),
      blob: options.prefetchedBlobs?.get(media.url),
    }));

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

      const zipBlob = new Blob([result.zipData as unknown as BlobPart], {
        type: 'application/zip',
      });
      const filename = options.zipFilename || generateZipFilename(mediaItems);

      // Save ZIP using appropriate download method
      const saveResult = await this.saveZipBlob(zipBlob, filename, options);

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
      return {
        success: false,
        status: 'error',
        filesProcessed: items.length,
        filesSuccessful: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
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
  ): Promise<{ success: boolean; error?: string }> {
    const capability = this.getCapability();

    if (capability.method === 'gm_download' && capability.gmDownload) {
      return this.saveWithGMDownload(capability.gmDownload, zipBlob, filename);
    }

    if (capability.method === 'fetch_blob') {
      logger.debug('[DownloadOrchestrator] Using anchor fallback for ZIP download');
      const fallbackResult = await downloadBlobWithAnchor(zipBlob, filename, {
        signal: options.signal,
        onProgress: options.onProgress,
      });
      // exactOptionalPropertyTypes: conditionally include error only if defined
      return fallbackResult.error
        ? { success: fallbackResult.success, error: fallbackResult.error }
        : { success: fallbackResult.success };
    }

    return { success: false, error: 'No download method available' };
  }

  /**
   * Save blob using GM_download
   * @internal
   */
  private async saveWithGMDownload(
    gmDownload: GMDownloadFunction,
    blob: Blob,
    filename: string,
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
        error: error instanceof Error ? error.message : 'GM_download failed',
      };
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}
