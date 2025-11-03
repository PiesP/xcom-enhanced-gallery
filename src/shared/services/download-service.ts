/**
 * DownloadService - Direct Tampermonkey GM_download integration
 *
 * **역할**: Blob/File 객체 다운로드 전용 (Phase 320+)
 *
 * Phase 320: Blob/File download support via Tampermonkey 5.4.0+ GM_download
 * Phase 314-4: Test mode support for non-userscript environments
 *
 * **사용 시나리오**:
 * - ✅ Blob/File 다운로드: downloadBlob(), downloadBlobBulk()
 * - ✅ 테스트 모드: downloadInTestMode(), downloadBlobBulkInTestMode()
 * - ❌ URL 기반 다운로드: UnifiedDownloadService 사용 권장
 *
 * **vs UnifiedDownloadService**:
 * - DownloadService: Blob/File 객체 → 브라우저 메모리 상의 데이터
 * - UnifiedDownloadService: URL 기반 → 원격 리소스 다운로드 + ZIP 조립
 *
 * Pattern: Singleton with async/await, error handling, user notifications
 * MV3 Compatible: All methods use standard browser APIs + Tampermonkey native features
 */

import { NotificationService } from './notification-service';
import { logger } from '../logging/logger';

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
 * Test mode download options - Phase 314-4
 * For testing in non-userscript environments
 */
export interface TestModeDownloadOptions {
  simulateSuccess?: boolean;
  simulateDelay?: number;
  errorMessage?: string;
}

/**
 * Test mode download result - Phase 314-4
 */
export interface TestModeDownloadResult extends BlobDownloadResult {
  testMode: true;
  simulatedAt: string;
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
   * Download in test mode - Phase 314-4
   *
   * Simulates a download without actually calling GM_download.
   * Useful for testing in development and test environments where Tampermonkey is unavailable.
   *
   * @param options Blob download options (blob, name, optional saveAs/conflictAction)
   * @param testOptions Test mode configuration (simulateSuccess, simulateDelay, errorMessage)
   * @returns Promise resolving to test mode download result
   *
   * @example
   * ```typescript
   * const blob = new Blob(['test data'], { type: 'text/plain' });
   * const result = await downloadService.downloadInTestMode(
   *   { blob, name: 'test.txt' },
   *   { simulateSuccess: true, simulateDelay: 500 }
   * );
   * console.log(result.testMode); // true
   * console.log(result.success);  // true
   * ```
   */
  async downloadInTestMode(
    options: BlobDownloadOptions,
    testOptions?: TestModeDownloadOptions
  ): Promise<TestModeDownloadResult> {
    const {
      simulateSuccess = true,
      simulateDelay = 100,
      errorMessage = 'Simulated test error',
    } = testOptions || {};

    try {
      // Simulate delay
      if (simulateDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, simulateDelay));
      }

      // Validate blob
      if (!options.blob || !(options.blob instanceof Blob)) {
        logger.warn('[DownloadService] Test mode: Invalid blob provided');
        return {
          success: false,
          error: 'Invalid blob provided',
          testMode: true,
          simulatedAt: new Date().toISOString(),
        };
      }

      const size = options.blob.size;

      if (simulateSuccess) {
        logger.info(
          `[DownloadService] Test mode: Simulated download of ${options.name} (${size} bytes)`
        );
        return {
          success: true,
          filename: options.name,
          size,
          testMode: true,
          simulatedAt: new Date().toISOString(),
        };
      }

      logger.warn(`[DownloadService] Test mode: Simulated download failure for ${options.name}`);
      return {
        success: false,
        filename: options.name,
        size,
        error: errorMessage,
        testMode: true,
        simulatedAt: new Date().toISOString(),
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[DownloadService] Test mode error:`, error);
      return {
        success: false,
        error: errorMsg,
        testMode: true,
        simulatedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Download multiple blobs in test mode - Phase 314-4
   *
   * Simulates bulk downloads without calling GM_download.
   *
   * @param options Array of Blob download options
   * @param testOptions Test mode configuration
   * @param onProgress Optional progress callback
   * @returns Promise resolving to array of test mode download results
   */
  async downloadBlobBulkInTestMode(
    options: BlobDownloadOptions[],
    testOptions?: TestModeDownloadOptions,
    onProgress?: (progress: { current: number; total: number }) => void
  ): Promise<TestModeDownloadResult[]> {
    const results: TestModeDownloadResult[] = [];
    const { simulateDelay = 50 } = testOptions || {};

    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      if (!option) {
        results.push({
          success: false,
          error: 'Invalid option',
          testMode: true,
          simulatedAt: new Date().toISOString(),
        });
        continue;
      }

      // Simulate with smaller delay for bulk
      const result = await this.downloadInTestMode(option, {
        ...testOptions,
        simulateDelay,
      });
      results.push(result);

      onProgress?.({
        current: i + 1,
        total: options.length,
      });

      // Small delay between simulated downloads
      if (i < options.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    logger.info(
      `[DownloadService] Test mode bulk: ${successCount}/${results.length} succeeded${failureCount > 0 ? `, ${failureCount} failed` : ''}`
    );

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
