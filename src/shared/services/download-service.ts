/** DownloadService wraps GM_download for Blob/File downloads. */

import { NotificationService } from './notification-service';
import { logger } from '@shared/logging/logger';
import { globalTimerManager } from '@shared/utils/timer-management';
import { getGMDownload } from './download/gm-download';

/** Options for downloading a Blob or File via GM_download. */
export interface BlobDownloadOptions {
  blob: Blob | File;
  name: string;
  saveAs?: boolean;
  conflictAction?: 'uniquify' | 'overwrite' | 'prompt';
  onProgress?: (event: ProgressEvent) => void;
  onError?: (error: Error) => void;
  suppressNotifications?: boolean;
}

/** Result of a blob download attempt. */
export interface BlobDownloadResult {
  success: boolean;
  filename?: string;
  error?: string;
  size?: number;
}

/** Singleton service for Blob/File downloads. */
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

  /** Download a single Blob or File. */
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
      const objectUrl = URL.createObjectURL(options.blob);

      return new Promise(resolve => {
        const timer = globalTimerManager.setTimeout(() => {
          resolve({ success: false, error: 'Download timeout', size });
          if (!options.suppressNotifications) {
            this.notificationService.error('Blob download timeout');
          }
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
              if (!options.suppressNotifications) {
                this.notificationService.success(`Downloaded: ${options.name}`);
              }
              logger.debug(
                `[DownloadService] Blob download completed: ${options.name} (${size} bytes)`
              );
            },
            onerror: (error: Record<string, unknown> | Error | string | null | undefined) => {
              cleanup();
              const errorMsg =
                error instanceof Error
                  ? error.message
                  : typeof error === 'object' && error && 'error' in error
                    ? String((error as Record<string, unknown>).error)
                    : String(error) || 'Unknown error';
              resolve({ success: false, error: errorMsg, filename: options.name, size });
              if (!options.suppressNotifications) {
                this.notificationService.error(`Download failed: ${errorMsg}`);
              }
              logger.error(`[DownloadService] Blob download failed:`, error);
            },
            ontimeout: () => {
              cleanup();
              resolve({ success: false, error: 'Download timeout', filename: options.name, size });
              if (!options.suppressNotifications) {
                this.notificationService.error('Download timeout');
              }
            },
          });
        } catch (error) {
          cleanup();
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

  /** Download multiple Blobs sequentially. */
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
        await new Promise(resolve => globalTimerManager.setTimeout(() => resolve(undefined), 100));
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
}

// Export singleton instance
export const downloadService = DownloadService.getInstance();
