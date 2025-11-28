import { logger } from '@shared/logging';
import { BaseServiceImpl } from '@shared/services/base-service';
import {
  detectDownloadCapability,
  downloadBlobWithAnchor,
} from '@shared/services/download/fallback-download';
import { downloadSingleFile, getGMDownload } from '@shared/services/download/single-download';
import type {
  BulkDownloadResult,
  DownloadOptions,
  OrchestratorItem,
  SingleDownloadResult,
} from '@shared/services/download/types';
import { downloadAsZip } from '@shared/services/download/zip-download';
import { generateMediaFilename, generateZipFilename } from '@shared/services/filename-service';
import type { MediaInfo } from '@shared/types/media.types';
import { ErrorCode } from '@shared/types/result.types';

export class DownloadOrchestrator extends BaseServiceImpl {
  private static instance: DownloadOrchestrator | null = null;

  private constructor() {
    super('DownloadOrchestrator');
  }

  public static getInstance(): DownloadOrchestrator {
    if (!DownloadOrchestrator.instance) {
      DownloadOrchestrator.instance = new DownloadOrchestrator();
    }
    return DownloadOrchestrator.instance;
  }

  protected async onInitialize(): Promise<void> {
    // No special initialization needed
  }

  protected onDestroy(): void {
    // Cleanup if needed
  }

  public async downloadSingle(
    media: MediaInfo,
    options: DownloadOptions = {}
  ): Promise<SingleDownloadResult> {
    return downloadSingleFile(media, options);
  }

  public async downloadBulk(
    mediaItems: MediaInfo[],
    options: DownloadOptions = {}
  ): Promise<BulkDownloadResult> {
    const items: OrchestratorItem[] = mediaItems.map(media => ({
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

      // Save using appropriate download method
      const capability = detectDownloadCapability();

      if (capability.method === 'gm_download') {
        // Use GM_download for Tampermonkey
        const gmDownload = getGMDownload();
        if (gmDownload) {
          const url = URL.createObjectURL(zipBlob);
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
          } finally {
            URL.revokeObjectURL(url);
          }
        }
      } else if (capability.method === 'fetch_blob') {
        // Use fallback anchor download for Violentmonkey and others
        logger.debug('[DownloadOrchestrator] Using anchor fallback for ZIP download');
        const fallbackResult = await downloadBlobWithAnchor(zipBlob, filename, {
          signal: options.signal,
          onProgress: options.onProgress,
        });

        if (!fallbackResult.success) {
          return {
            success: false,
            status: 'error',
            filesProcessed: items.length,
            filesSuccessful: result.filesSuccessful,
            error: fallbackResult.error || 'Failed to save ZIP file',
            failures: result.failures,
            code: ErrorCode.ALL_FAILED,
          };
        }
      } else {
        return {
          success: false,
          status: 'error',
          filesProcessed: items.length,
          filesSuccessful: 0,
          error: 'No download method available',
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
}
