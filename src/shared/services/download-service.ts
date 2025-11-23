/**
 * DownloadService
 *
 * **Role**: Media download management (Single/Bulk/ZIP)
 *
 * **Features**:
 * - Single file: Direct GM_download (efficient, stream-to-disk)
 * - Bulk/ZIP: In-memory assembly via DownloadOrchestrator
 * - Unified API for all download operations
 */

import type { MediaInfo } from '@shared/types/media.types';
import { getErrorMessage } from '@shared/utils/error-handling';
import { generateMediaFilename, generateZipFilename } from './file-naming';
import { DownloadOrchestrator } from './download/download-orchestrator';
import { logger } from '@shared/logging';
import { globalTimerManager } from '@shared/utils/timer-management';
import type { DownloadProgress } from './download/types';
import { ErrorCode } from '@shared/types/result.types';
import { getGMDownload } from './download/gm-download';

// ====================================
// Types
// ====================================

export interface DownloadOptions {
  signal?: AbortSignal;
  onProgress?: (progress: DownloadProgress) => void;
  concurrency?: number;
  retries?: number;
  zipFilename?: string;
  blob?: Blob; // Phase 368: Support for prefetched blob (single)
  prefetchedBlobs?: Map<string, Blob>; // Phase 368: Support for prefetched blobs (bulk)
}

interface BlobDownloadOptions {
  blob: Blob | File;
  name: string;
  saveAs?: boolean;
  conflictAction?: 'uniquify' | 'overwrite' | 'prompt';
  suppressNotifications?: boolean;
}

interface BlobDownloadResult {
  success: boolean;
  filename?: string;
  error?: string;
  size?: number;
}

export interface SingleDownloadResult {
  success: boolean;
  filename?: string;
  error?: string | undefined;
}

export interface BulkDownloadResult {
  success: boolean;
  status: 'success' | 'partial' | 'error';
  filesProcessed: number;
  filesSuccessful: number;
  filename?: string | undefined;
  error?: string | undefined;
  failures?: Array<{ url: string; error: string }> | undefined;
  code: ErrorCode;
}

// ====================================
// DownloadService
// ====================================

export class DownloadService {
  private static instance: DownloadService | null = null;
  private readonly orchestrator = DownloadOrchestrator.getInstance();
  private currentAbortController: AbortController | undefined;

  private constructor() {}

  static getInstance(): DownloadService {
    if (!this.instance) {
      this.instance = new DownloadService();
    }
    return this.instance;
  }

  // ====================================
  // Single file download
  // ====================================

  /**
   * Download single file using GM_download
   */
  async downloadSingle(
    media: MediaInfo,
    options: DownloadOptions = {}
  ): Promise<SingleDownloadResult> {
    if (options.signal?.aborted) {
      return { success: false, error: 'User cancelled download' };
    }

    const gmDownload = getGMDownload();
    if (!gmDownload) {
      return { success: false, error: 'Must be run in Tampermonkey environment' };
    }

    const filename = generateMediaFilename(media);

    // Phase 368: Use prefetched blob if available
    if (options.blob) {
      logger.debug(`[DownloadService] Using prefetched blob for ${filename}`);
      const result = await this.downloadBlob({
        blob: options.blob,
        name: filename,
        suppressNotifications: true,
      });

      if (result.success) {
        // Notification removed - handled by caller
        options.onProgress?.({ phase: 'complete', current: 1, total: 1, percentage: 100 });
        return { success: true, filename };
      }
      // Fallback to URL download if blob download fails?
      // Usually if blob download fails, it's a GM_download issue, so URL might fail too.
      // But let's return error for now.
      return { success: false, error: result.error, filename };
    }

    const url = media.url;

    return new Promise(resolve => {
      // Timeout safety
      const timer = globalTimerManager.setTimeout(() => {
        // Notification removed - handled by caller
        options.onProgress?.({ phase: 'complete', current: 1, total: 1, percentage: 0 });
        resolve({ success: false, error: 'Download timeout' });
      }, 30000);

      try {
        gmDownload({
          url,
          name: filename,
          onload: () => {
            globalTimerManager.clearTimeout(timer);
            // Notification removed - handled by caller
            logger.debug(`[DownloadService] Single file download complete: ${filename}`);
            options.onProgress?.({ phase: 'complete', current: 1, total: 1, percentage: 100 });
            resolve({ success: true, filename });
          },
          onerror: (error: unknown) => {
            globalTimerManager.clearTimeout(timer);
            const errorMsg = getErrorMessage(error);
            // Notification removed - handled by caller
            logger.error('[DownloadService] Single file download failed:', error);
            options.onProgress?.({ phase: 'complete', current: 1, total: 1, percentage: 0 });
            resolve({ success: false, error: errorMsg, filename });
          },
          ontimeout: () => {
            globalTimerManager.clearTimeout(timer);
            // Notification removed - handled by caller
            logger.warn('[DownloadService] Single file download timeout');
            options.onProgress?.({ phase: 'complete', current: 1, total: 1, percentage: 0 });
            resolve({ success: false, error: 'Download timeout' });
          },
        });
      } catch (error) {
        globalTimerManager.clearTimeout(timer);
        const errorMsg = getErrorMessage(error);
        // Notification removed - handled by caller
        logger.error('[DownloadService] GM_download error:', error);
        resolve({ success: false, error: errorMsg });
      }
    });
  }

  // ====================================
  // Bulk file download
  // ====================================

  async downloadBulk(
    mediaItems: Array<MediaInfo>,
    options: DownloadOptions = {}
  ): Promise<BulkDownloadResult> {
    if (mediaItems.length === 0) {
      return {
        success: false,
        status: 'error',
        filesProcessed: 0,
        filesSuccessful: 0,
        error: 'No files to download',
        code: ErrorCode.EMPTY_INPUT,
      };
    }

    // Single file optimization
    if (mediaItems.length === 1) {
      const media = mediaItems[0];
      if (!media) return { success: false, status: 'error', filesProcessed: 1, filesSuccessful: 0, error: 'No media', code: ErrorCode.UNKNOWN };

      const result = await this.downloadSingle(media, options);
      return {
        success: result.success,
        status: result.success ? 'success' : 'error',
        filesProcessed: 1,
        filesSuccessful: result.success ? 1 : 0,
        filename: result.filename,
        error: result.error,
        code: result.success ? ErrorCode.NONE : ErrorCode.UNKNOWN,
      };
    }

    return this.downloadAsZip(mediaItems, options);
  }

  // ====================================
  // ZIP download
  // ====================================

  private async downloadAsZip(
    mediaItems: Array<MediaInfo>,
    options: DownloadOptions
  ): Promise<BulkDownloadResult> {
    try {
      this.currentAbortController = new AbortController();
      logger.info(`[DownloadService] ZIP download started: ${mediaItems.length} files`);

      const itemsForZip = mediaItems.map(m => ({
        url: m.url,
        desiredName: generateMediaFilename(m),
        blob: options.prefetchedBlobs?.get(m.url),
      }));

      const { filesSuccessful, failures, zipData } = await this.orchestrator.zipMediaItems(
        itemsForZip,
        {
          concurrency: options.concurrency,
          retries: options.retries,
          signal: this.currentAbortController.signal,
          onProgress: options.onProgress,
        }
      );

      if (filesSuccessful === 0) {
        throw new Error('All file downloads failed');
      }

      const zipFilename = options.zipFilename || generateZipFilename(mediaItems, { fallbackPrefix: 'xcom_gallery' });
      const blob = new Blob([new Uint8Array(zipData)], { type: 'application/zip' });

      const downloadResult = await this.downloadBlob({
        blob,
        name: zipFilename,
        suppressNotifications: true,
      });

      if (!downloadResult.success) {
        throw new Error(downloadResult.error ?? 'ZIP download failed');
      }

      // Notification removed - handled by caller
      logger.info(`[DownloadService] ZIP download complete: ${zipFilename}`);

      const status = failures.length === 0 ? 'success' : failures.length === mediaItems.length ? 'error' : 'partial';

      return {
        success: status !== 'error',
        status,
        filesProcessed: mediaItems.length,
        filesSuccessful,
        filename: zipFilename,
        failures: failures.length > 0 ? failures : undefined,
        code: status === 'success' ? ErrorCode.NONE : status === 'partial' ? ErrorCode.PARTIAL_FAILED : ErrorCode.ALL_FAILED,
      };
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      logger.error(`[DownloadService] ZIP download failed:`, error);
      // Notification removed - handled by caller

      return {
        success: false,
        status: 'error',
        filesProcessed: mediaItems.length,
        filesSuccessful: 0,
        error: errorMsg,
        code: ErrorCode.UNKNOWN,
      };
    } finally {
      this.currentAbortController = undefined;
    }
  }

  // ====================================
  // Internal & Utility
  // ====================================

  cancelDownload(): void {
    if (!this.currentAbortController) return;
    this.currentAbortController.abort();
    // Notification removed - handled by caller
    logger.info('[DownloadService] Download cancelled');
  }

  isDownloading(): boolean {
    return this.currentAbortController !== undefined;
  }

  private async downloadBlob(options: BlobDownloadOptions): Promise<BlobDownloadResult> {
    const gmDownload = getGMDownload();
    if (!gmDownload) return { success: false, error: 'GM_download unavailable' };
    if (!options.blob || !(options.blob instanceof Blob)) return { success: false, error: 'Invalid blob' };

    const size = options.blob.size;
    const objectUrl = URL.createObjectURL(options.blob);

    return new Promise(resolve => {
      const timer = globalTimerManager.setTimeout(() => {
        resolve({ success: false, error: 'Download timeout', size });
        // Notification removed - handled by caller
      }, 30000);

      const cleanup = () => {
        globalTimerManager.clearTimeout(timer);
        URL.revokeObjectURL(objectUrl);
      };

      try {
        gmDownload({
          url: objectUrl,
          name: options.name,
          saveAs: options.saveAs ?? false,
          conflictAction: options.conflictAction ?? 'uniquify',
          onload: () => {
            cleanup();
            resolve({ success: true, filename: options.name, size });
            // Notification removed - handled by caller
            logger.debug(`[DownloadService] Blob download completed: ${options.name} (${size} bytes)`);
          },
          onerror: (error: any) => {
            cleanup();
            const errorMsg = getErrorMessage(error);
            resolve({ success: false, error: errorMsg, filename: options.name, size });
            // Notification removed - handled by caller
            logger.error(`[DownloadService] Blob download failed:`, error);
          },
          ontimeout: () => {
            cleanup();
            resolve({ success: false, error: 'Download timeout', filename: options.name, size });
            // Notification removed - handled by caller
          },
        });
      } catch (error) {
        cleanup();
        const errorMsg = getErrorMessage(error);
        resolve({ success: false, error: errorMsg, size });
        logger.error(`[DownloadService] GM_download error:`, error);
      }
    });
  }
}

export const downloadService = DownloadService.getInstance();
