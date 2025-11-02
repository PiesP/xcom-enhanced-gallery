/**
 * DownloadService - Direct Tampermonkey GM_download integration
 *
 * Phase 309: URL-based downloads (now superseded by UnifiedDownloadService)
 * Phase 320: Blob/File download support via Tampermonkey 5.4.0+ GM_download
 *
 * Current Use:
 * - Blob/File downloads: downloadBlob(), downloadBlobBulk() ✅ Active
 * - URL-based downloads: downloadSingle(), downloadBulk() (deprecated, unused)
 *
 * Pattern: Singleton with async/await, error handling, user notifications
 * MV3 Compatible: All methods use standard browser APIs + Tampermonkey native features
 */

import type { MediaInfo } from '../types/media.types';
import { generateMediaFilename } from './file-naming';
import { NotificationService } from './notification-service';
import { logger } from '../logging/logger';

/**
 * Test mode detection result
 */
export interface TestModeDetectionResult {
  isTestMode: boolean;
  environment: string;
  message: string;
  canSimulate: boolean;
}

export interface DownloadOptions {
  signal?: AbortSignal;
  onProgress?: (progress: { current: number; total: number }) => void;
}

export interface SingleDownloadResult {
  success: boolean;
  filename?: string;
  error?: string;
}

export interface BulkDownloadResult {
  success: boolean;
  filesProcessed: number;
  filesSuccessful: number;
  error?: string;
  failures?: Array<{ url: string; error: string }>;
}

/**
 * Blob/File download options - Phase 320
 * Supports downloading Blob or File objects directly
 * Compatible with Tampermonkey 5.4.0+ where GM_download accepts Blob/File
 */
export interface BlobDownloadOptions {
  blob: Blob | File;
  name: string;
  saveAs?: boolean;
  conflictAction?: 'uniquify' | 'overwrite' | 'prompt';
  onProgress?: (event: ProgressEvent) => void;
  onError?: (error: Error) => void;
}

/**
 * Blob/File download result - Phase 320
 */
export interface BlobDownloadResult {
  success: boolean;
  filename?: string;
  error?: string;
  size?: number;
}

/**
 * Get GM_download from userscript global context
 */
function getGMDownload(): ((options: Record<string, unknown>) => void) | undefined {
  const gm = globalThis as Record<string, unknown> & {
    GM_download?: (options: Record<string, unknown>) => void;
  };
  if (typeof gm.GM_download === 'function') {
    return gm.GM_download;
  }
  return undefined;
}

/**
 * DownloadService - Singleton for file downloads
 */
export class DownloadService {
  private static instance: DownloadService | null = null;
  private readonly notificationService = NotificationService.getInstance();

  private constructor() {}

  static getInstance(): DownloadService {
    if (!DownloadService.instance) {
      DownloadService.instance = new DownloadService();
    }
    return DownloadService.instance;
  }

  /**
   * Detect if running in test mode and determine simulation capability
   * Uses environment-detector (Phase 314-1) for 4-signal environment detection
   *
   * @returns Test mode detection result with environment context
   */
  async detectTestMode(): Promise<TestModeDetectionResult> {
    const { detectEnvironment } = await import('@shared/external/userscript');

    const env = detectEnvironment();
    const gmDownload = (globalThis as Record<string, unknown>).GM_download;

    const isTestMode = env.isTestEnvironment || !gmDownload;

    return {
      isTestMode,
      environment: env.environment,
      message: isTestMode
        ? `✅ Test mode detected in ${env.environment} environment. Simulation will be used instead of GM_download.`
        : `✅ Production mode in ${env.environment} environment. Real GM_download will be used.`,
      canSimulate: true, // Always can simulate
    };
  }

  /**
   * Simulate download for testing purposes
   * Does not make actual network requests, just simulates behavior
   *
   * @param media Media to simulate downloading
   * @param options Download options (supports abort signal, progress callback)
   * @returns Simulated download result
   */
  async simulateDownload(
    media: MediaInfo,
    options: DownloadOptions = {}
  ): Promise<SingleDownloadResult> {
    try {
      if (options.signal?.aborted) {
        return { success: false, error: 'Download cancelled' };
      }

      const filename = generateMediaFilename({
        id: media.id,
        url: media.url,
        type: media.type,
        ...(media.originalUrl && { originalUrl: media.originalUrl }),
        ...(media.filename && { filename: media.filename }),
        ...(media.tweetUsername && { tweetUsername: media.tweetUsername }),
        ...(media.tweetId && { tweetId: media.tweetId }),
      });

      // Simulate network delay (100-300ms)
      const delay = Math.random() * 200 + 100;
      await new Promise(resolve => setTimeout(resolve, delay));

      if (options.signal?.aborted) {
        return { success: false, error: 'Download cancelled' };
      }

      logger.debug(`[DownloadService] Simulated download: ${filename}`, {
        url: media.url,
        delay,
      });

      return { success: true, filename };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Simulation error';
      logger.error(`[DownloadService] Simulation failed:`, error);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Download single media file with test mode awareness
   *
   * @deprecated Use UnifiedDownloadService.downloadSingle() for URL-based downloads instead.
   * This method is not used by any feature (kept for backward compatibility only).
   * Will be removed in a future phase when UnifiedDownloadService becomes the standard.
   *
   * Automatically uses simulation in test environments.
   */
  async downloadSingle(
    media: MediaInfo,
    options: DownloadOptions = {}
  ): Promise<SingleDownloadResult> {
    try {
      if (options.signal?.aborted) {
        return { success: false, error: 'Download cancelled' };
      }

      const gmDownload = getGMDownload();
      if (!gmDownload) {
        return { success: false, error: 'Tampermonkey download not available' };
      }

      const filename = generateMediaFilename({
        id: media.id,
        url: media.url,
        type: media.type,
        ...(media.originalUrl && { originalUrl: media.originalUrl }),
        ...(media.filename && { filename: media.filename }),
        ...(media.tweetUsername && { tweetUsername: media.tweetUsername }),
        ...(media.tweetId && { tweetId: media.tweetId }),
      });

      return new Promise(resolve => {
        const timer = setTimeout(() => {
          resolve({ success: false, error: 'Download timeout' });
        }, 30000);

        try {
          gmDownload({
            url: media.url,
            name: filename,
            onload: () => {
              clearTimeout(timer);
              resolve({ success: true, filename });
              this.notificationService.success(`Downloaded: ${filename}`);
              logger.debug(`[DownloadService] Single download completed: ${filename}`);
            },
            onerror: (error: Record<string, unknown> | Error | string | null | undefined) => {
              clearTimeout(timer);
              const errorMsg =
                error instanceof Error
                  ? error.message
                  : typeof error === 'object' && error && 'error' in error
                    ? String((error as Record<string, unknown>).error)
                    : String(error) || 'Unknown error';
              resolve({ success: false, error: errorMsg, filename });
              this.notificationService.error(`Download failed: ${errorMsg}`);
              logger.error(`[DownloadService] Single download failed:`, error);
            },
            ontimeout: () => {
              clearTimeout(timer);
              resolve({ success: false, error: 'Download timeout', filename });
              this.notificationService.error('Download timeout');
            },
          });
        } catch (error) {
          clearTimeout(timer);
          const errorMsg = error instanceof Error ? error.message : String(error);
          resolve({ success: false, error: errorMsg });
          logger.error(`[DownloadService] GM_download error:`, error);
        }
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[DownloadService] Single download exception:`, error);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Download multiple media files sequentially
   *
   * @deprecated Use UnifiedDownloadService.downloadBulk() for URL-based downloads instead.
   * This method is not used by any feature (kept for backward compatibility only).
   * Will be removed in a future phase when UnifiedDownloadService becomes the standard.
   */
  async downloadBulk(
    mediaItems: MediaInfo[],
    options: DownloadOptions = {}
  ): Promise<BulkDownloadResult> {
    try {
      if (!mediaItems.length) {
        return { success: true, filesProcessed: 0, filesSuccessful: 0 };
      }

      if (options.signal?.aborted) {
        return {
          success: false,
          filesProcessed: 0,
          filesSuccessful: 0,
          error: 'Bulk download cancelled',
        };
      }

      const gmDownload = getGMDownload();
      if (!gmDownload) {
        return {
          success: false,
          filesProcessed: 0,
          filesSuccessful: 0,
          error: 'Tampermonkey download not available',
        };
      }

      const failures: Array<{ url: string; error: string }> = [];
      let successCount = 0;

      for (const media of mediaItems) {
        if (options.signal?.aborted) {
          break;
        }

        const result = await this.downloadSingle(media, {
          ...(options.signal && { signal: options.signal }),
        });
        if (result.success) {
          successCount++;
        } else {
          failures.push({
            url: media.url,
            error: result.error || 'Unknown error',
          });
        }

        options.onProgress?.({
          current: mediaItems.indexOf(media) + 1,
          total: mediaItems.length,
        });

        // Small delay between downloads to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const success = failures.length === 0;
      if (success) {
        this.notificationService.success(
          `Bulk download complete: ${successCount}/${mediaItems.length} files`
        );
      } else {
        this.notificationService.warning(
          `Bulk download: ${successCount}/${mediaItems.length} succeeded, ${failures.length} failed`
        );
      }

      logger.info(`[DownloadService] Bulk download: ${successCount}/${mediaItems.length}`, {
        failures: failures.length,
      });

      return {
        success,
        filesProcessed: mediaItems.length,
        filesSuccessful: successCount,
        ...(failures.length > 0 && { failures }),
        ...(failures.length > 0 && { error: `${failures.length} files failed` }),
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[DownloadService] Bulk download exception:`, error);
      return {
        success: false,
        filesProcessed: 0,
        filesSuccessful: 0,
        error: errorMsg,
      };
    }
  }

  /**
   * Download a single Blob or File - Phase 320
   *
   * Requires Tampermonkey 5.4.0+ where GM_download supports Blob/File.
   * MV3 Compatible: Uses standard Blob API and Tampermonkey native feature.
   *
   * @param options Blob download options (blob, name, optional saveAs/conflictAction)
   * @returns Promise resolving to download result
   *
   * @example
   * ```typescript
   * const blob = new Blob(['data'], { type: 'text/plain' });
   * const result = await downloadService.downloadBlob({
   *   blob,
   *   name: 'data.txt',
   *   saveAs: true
   * });
   * if (result.success) {
   *   console.log(`Downloaded: ${result.filename}`);
   * }
   * ```
   */
  async downloadBlob(options: BlobDownloadOptions): Promise<BlobDownloadResult> {
    try {
      const gmDownload = getGMDownload();
      if (!gmDownload) {
        return {
          success: false,
          error: 'GM_download not available in this environment',
        };
      }

      // Validate blob
      if (!options.blob || !(options.blob instanceof Blob)) {
        return {
          success: false,
          error: 'Invalid blob provided',
        };
      }

      // Get size for reporting
      const size = options.blob.size;

      return new Promise(resolve => {
        const timer = setTimeout(() => {
          resolve({ success: false, error: 'Download timeout', size });
          this.notificationService.error('Blob download timeout');
        }, 30000);

        try {
          gmDownload({
            blob: options.blob,
            name: options.name,
            saveAs: options.saveAs ?? false,
            conflictAction: options.conflictAction ?? 'uniquify',
            onload: () => {
              clearTimeout(timer);
              resolve({ success: true, filename: options.name, size });
              this.notificationService.success(`Downloaded: ${options.name}`);
              logger.debug(
                `[DownloadService] Blob download completed: ${options.name} (${size} bytes)`
              );
            },
            onerror: (error: Record<string, unknown> | Error | string | null | undefined) => {
              clearTimeout(timer);
              const errorMsg =
                error instanceof Error
                  ? error.message
                  : typeof error === 'object' && error && 'error' in error
                    ? String((error as Record<string, unknown>).error)
                    : String(error) || 'Unknown error';
              resolve({ success: false, error: errorMsg, filename: options.name, size });
              this.notificationService.error(`Download failed: ${errorMsg}`);
              logger.error(`[DownloadService] Blob download failed:`, error);
            },
            ontimeout: () => {
              clearTimeout(timer);
              resolve({ success: false, error: 'Download timeout', filename: options.name, size });
              this.notificationService.error('Download timeout');
            },
          });
        } catch (error) {
          clearTimeout(timer);
          const errorMsg = error instanceof Error ? error.message : String(error);
          resolve({ success: false, error: errorMsg, size });
          logger.error(`[DownloadService] GM_download error:`, error);
        }
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[DownloadService] Blob download exception:`, error);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Download multiple Blobs sequentially - Phase 320
   *
   * Downloads multiple Blob objects with a small delay between each
   * to avoid overwhelming the system.
   *
   * @param options Array of Blob download options
   * @param onProgress Optional progress callback
   * @returns Promise resolving to array of download results
   *
   * @example
   * ```typescript
   * const blobs = [
   *   new Blob(['data1'], { type: 'text/plain' }),
   *   new Blob(['data2'], { type: 'text/plain' })
   * ];
   * const results = await downloadService.downloadBlobBulk(
   *   blobs.map((blob, i) => ({ blob, name: `file-${i}.txt` })),
   *   (progress) => console.log(`${progress.current}/${progress.total}`)
   * );
   * ```
   */
  async downloadBlobBulk(
    options: BlobDownloadOptions[],
    onProgress?: (progress: { current: number; total: number }) => void
  ): Promise<BlobDownloadResult[]> {
    const results: BlobDownloadResult[] = [];
    let successCount = 0;

    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      if (!option) {
        // Skip undefined options
        results.push({ success: false, error: 'Invalid option' });
        continue;
      }

      const result = await this.downloadBlob(option);
      results.push(result);
      if (result.success) {
        successCount++;
      }

      onProgress?.({
        current: i + 1,
        total: options.length,
      });

      // Small delay between downloads to avoid overwhelming the system
      if (i < options.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Log summary
    const failureCount = options.length - successCount;
    if (failureCount === 0) {
      this.notificationService.success(
        `Bulk blob download complete: ${successCount}/${options.length} files`
      );
      logger.info(
        `[DownloadService] Blob bulk download: ${successCount}/${options.length} succeeded`
      );
    } else {
      this.notificationService.warning(
        `Bulk blob download: ${successCount}/${options.length} succeeded, ${failureCount} failed`
      );
      logger.warn(
        `[DownloadService] Blob bulk download: ${successCount}/${options.length} succeeded, ${failureCount} failed`
      );
    }

    return results;
  }

  /**
   * Reset service state
   *
   * @internal Not used by any feature (reserved for potential future use)
   */
  reset(): void {
    logger.debug('[DownloadService] Service reset');
  }
}

// Export singleton instance
export const downloadService = DownloadService.getInstance();
