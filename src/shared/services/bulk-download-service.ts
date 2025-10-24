/**
 * @fileoverview 일괄 다운로드 서비스
 * @description ZIP 및 개별 다운로드 기능 제공
 * @version 2.0.0 - Phase A5.5: BaseServiceImpl 패턴 적용
 */

import type { MediaInfo, MediaItem } from '../types/media.types';
import type { MediaItemForFilename } from '../types/media.types';
import { logger, createCorrelationId, createScopedLoggerWithCorrelation } from '../logging/logger';
import { getNativeDownload } from '../external/vendors';
import { getErrorMessage } from '../utils/error-handling';
import { generateMediaFilename } from '../media/filename-service';
import { toastManager } from './unified-toast-manager';
import { languageService } from './language-service';
import type { BaseResultStatus } from '../types/result.types';
import { ErrorCode } from '../types/result.types';
import { DownloadOrchestrator } from './download/download-orchestrator';
import type { DownloadProgress } from './download/types';
import { BaseServiceImpl } from './base-service-impl';

export interface BulkDownloadOptions {
  onProgress?: (progress: DownloadProgress) => void;
  signal?: AbortSignal;
  zipFilename?: string;
  concurrency?: number;
  retries?: number;
}

export interface DownloadResult {
  success: boolean;
  status: BaseResultStatus;
  filesProcessed: number;
  filesSuccessful: number;
  error?: string;
  filename?: string;
  failures?: Array<{ url: string; error: string }>;
  code?: ErrorCode;
}

export interface SingleDownloadResult {
  success: boolean;
  status: BaseResultStatus;
  filename?: string;
  error?: string;
}

function ensureMediaItem(media: MediaInfo | MediaItem): MediaItem & { id: string } {
  return {
    ...media,
    id: media.id || `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
}

function toFilenameCompatible(media: MediaInfo | MediaItem): MediaItemForFilename {
  const ensured = ensureMediaItem(media);
  return {
    id: ensured.id,
    url: ensured.url,
    originalUrl: ensured.originalUrl || undefined,
    type: ensured.type,
    filename: ensured.filename,
    tweetUsername: ensured.tweetUsername,
    tweetId: ensured.tweetId,
  };
}

export class BulkDownloadService extends BaseServiceImpl {
  private currentAbortController: AbortController | undefined;

  constructor() {
    super('BulkDownloadService');
  }

  /**
   * 서비스 초기화 (BaseServiceImpl 템플릿 메서드 구현)
   */
  protected async onInitialize(): Promise<void> {
    // No initialization needed for bulk download service
    // Orchestrator is created lazily on first use
  }

  /**
   * 서비스 정리 (BaseServiceImpl 템플릿 메서드 구현)
   */
  protected onDestroy(): void {
    this.currentAbortController?.abort();
  }

  public async downloadSingle(
    media: MediaInfo | MediaItem,
    options: { signal?: AbortSignal } = {}
  ): Promise<SingleDownloadResult> {
    try {
      const converted = toFilenameCompatible(media);
      const filename = generateMediaFilename(converted);
      const download = getNativeDownload();
      if (options.signal?.aborted) throw new Error('Download cancelled by user');
      const defaultTimeout = AbortSignal.timeout?.(20_000);
      let signal: AbortSignal | undefined = options.signal ?? defaultTimeout;
      if (options.signal && defaultTimeout) {
        const controller = new AbortController();
        const onAbort = () => controller.abort();
        options.signal.addEventListener('abort', onAbort, { once: true });
        defaultTimeout.addEventListener('abort', onAbort, { once: true });
        signal = controller.signal;
      }
      const response = await fetch(media.url, { ...(signal ? { signal } : {}) } as RequestInit);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const blob = await response.blob();
      download.downloadBlob(blob, filename);
      logger.debug(`[BulkDownloadService] Downloaded: ${filename}`);
      return { success: true, status: 'success', filename };
    } catch (error) {
      const message = getErrorMessage(error);
      logger.error(`[BulkDownloadService] Download failed: ${message}`);
      const status: BaseResultStatus = message.toLowerCase().includes('cancel')
        ? 'cancelled'
        : 'error';
      return { success: false, status, error: message };
    }
  }

  public async downloadMultiple(
    mediaItems: Array<MediaInfo | MediaItem> | readonly (MediaInfo | MediaItem)[],
    options: BulkDownloadOptions = {}
  ): Promise<DownloadResult> {
    const correlationId = createCorrelationId();
    const slog = createScopedLoggerWithCorrelation('BulkDownload', correlationId);
    const items = Array.from(mediaItems);
    if (items.length === 0) {
      return {
        success: false,
        status: 'error',
        filesProcessed: 0,
        filesSuccessful: 0,
        error: 'No files to download',
        code: ErrorCode.EMPTY_INPUT,
      } as DownloadResult & { code: ErrorCode };
    }
    try {
      this.currentAbortController = new AbortController();
      slog.info('Download session started', { count: items.length });
      if (options.signal) {
        options.signal.addEventListener(
          'abort',
          () => {
            this.currentAbortController?.abort();
            slog.warn('Abort signal received');
            toastManager.info(
              languageService.getString('messages.download.cancelled.title'),
              languageService.getString('messages.download.cancelled.body')
            );
          },
          { once: true }
        );
      }
      if (items.length === 1) {
        const firstItem = items[0];
        if (!firstItem) {
          return {
            success: false,
            status: 'error',
            filesProcessed: 1,
            filesSuccessful: 0,
            error: 'Invalid media item',
          };
        }
        options.onProgress?.({ phase: 'preparing', current: 0, total: 1, percentage: 0 });
        options.onProgress?.({
          phase: 'downloading',
          current: 1,
          total: 1,
          percentage: 100,
          filename: generateMediaFilename(toFilenameCompatible(firstItem)),
        });
        const result = await this.downloadSingle(firstItem, {
          signal: this.currentAbortController.signal,
        });
        slog.info('Single download finished', {
          success: result.success,
          filename: result.filename,
        });
        const singleOutcome: DownloadResult & { code?: ErrorCode } = {
          success: result.success,
          status: result.status,
          filesProcessed: 1,
          filesSuccessful: result.success ? 1 : 0,
          ...(result.error && { error: result.error }),
          ...(result.filename && { filename: result.filename }),
          ...(result.success
            ? { code: ErrorCode.NONE }
            : {
                code: result.status === 'cancelled' ? ErrorCode.CANCELLED : ErrorCode.UNKNOWN,
              }),
        };
        if (!result.success && result.error) {
          toastManager.error(
            languageService.getString('messages.download.single.error.title'),
            languageService.getFormattedString('messages.download.single.error.body', {
              error: String(result.error ?? ''),
            })
          );
        }
        if (result.success) {
          options.onProgress?.({
            phase: 'complete',
            current: 1,
            total: 1,
            percentage: 100,
            ...(result.filename ? { filename: result.filename } : {}),
          });
        }
        return singleOutcome;
      }
      return await this.downloadAsZip(items, options);
    } finally {
      this.currentAbortController = undefined;
    }
  }

  private async downloadAsZip(
    mediaItems: Array<MediaInfo | MediaItem>,
    options: BulkDownloadOptions
  ): Promise<DownloadResult> {
    try {
      const correlationId = createCorrelationId();
      const slog = createScopedLoggerWithCorrelation('BulkDownload', correlationId);
      const download = getNativeDownload();
      const abortSignal = this.currentAbortController?.signal;
      const itemsForZip = mediaItems.map(m => ({
        url: m.url,
        desiredName: generateMediaFilename(toFilenameCompatible(m)),
      }));
      const orchOptions = {
        ...(typeof options.concurrency === 'number' ? { concurrency: options.concurrency } : {}),
        ...(typeof options.retries === 'number' ? { retries: options.retries } : {}),
        ...(abortSignal ? { signal: abortSignal } : {}),
        ...(options.onProgress ? { onProgress: options.onProgress } : {}),
      } as const;
      const {
        filesSuccessful: successful,
        failures,
        zipData,
      } = await DownloadOrchestrator.getInstance().zipMediaItems(itemsForZip, orchOptions);
      if (successful === 0) {
        toastManager.error(
          languageService.getString('messages.download.allFailed.title'),
          languageService.getString('messages.download.allFailed.body')
        );
        throw new Error('All downloads failed');
      }
      const zipFilename = options.zipFilename || `download_${Date.now()}.zip`;
      const blob = new Blob([new Uint8Array(zipData)], { type: 'application/zip' });
      download.downloadBlob(blob, zipFilename);
      options.onProgress?.({
        phase: 'complete',
        current: mediaItems.length,
        total: mediaItems.length,
        percentage: 100,
      });
      slog.info('ZIP download complete', { zipFilename, successful, total: mediaItems.length });
      const status: BaseResultStatus =
        failures.length === 0
          ? 'success'
          : failures.length === mediaItems.length
            ? 'error'
            : 'partial';
      const code: ErrorCode =
        status === 'success'
          ? ErrorCode.NONE
          : status === 'partial'
            ? ErrorCode.PARTIAL_FAILED
            : failures.length === mediaItems.length
              ? ErrorCode.ALL_FAILED
              : ErrorCode.UNKNOWN;
      const result: DownloadResult & { code: ErrorCode } = {
        success: status === 'success' || status === 'partial',
        status,
        filesProcessed: mediaItems.length,
        filesSuccessful: successful,
        filename: zipFilename,
        ...(failures.length > 0 ? { failures } : {}),
        code,
      };
      if (failures.length > 0 && failures.length < mediaItems.length) {
        const failedMap = new Map(failures.map(f => [f.url, f.error] as const));
        const failedItems = mediaItems.filter(m => failedMap.has(m.url));
        toastManager.warning(
          languageService.getString('messages.download.partial.title'),
          languageService.getFormattedString('messages.download.partial.body', {
            count: failures.length,
          }),
          {
            actionText: languageService.getString('messages.download.retry.action'),
            onAction: () => {
              const maxRetryConcurrency = Math.min(2, failedItems.length);
              const remaining: Array<{ url: string; error: string }> = [];
              let idx = 0;
              toastManager.success(
                languageService.getString('messages.download.retry.success.title'),
                languageService.getString('messages.download.retry.success.body'),
                { route: 'both' }
              );
              const run = async () => {
                while (idx < failedItems.length) {
                  const myIndex = idx++;
                  const item = failedItems[myIndex];
                  if (!item) break;
                  try {
                    const retryOptions = {
                      retries: options.retries ?? 0,
                      concurrency: 1,
                      ...(abortSignal ? { signal: abortSignal } : {}),
                    } as const;
                    await DownloadOrchestrator.getInstance().zipMediaItems(
                      [{ url: item.url, desiredName: item.filename ?? 'file.bin' }],
                      retryOptions
                    );
                  } catch (e) {
                    remaining.push({ url: item.url, error: getErrorMessage(e) });
                  }
                }
              };
              Promise.all(Array.from({ length: maxRetryConcurrency }, run)).then(() => {
                if (remaining.length > 0) {
                  toastManager.warning(
                    languageService.getString('messages.download.partial.title'),
                    `${languageService.getFormattedString('messages.download.partial.body', {
                      count: remaining.length,
                    })} (cid: ${correlationId})`
                  );
                }
              });
            },
          }
        );
      }
      return result;
    } catch (error) {
      const message = getErrorMessage(error);
      logger.error(`[BulkDownloadService] ZIP download failed: ${message}`);
      const lowered = message.toLowerCase();
      const status: BaseResultStatus = lowered.includes('cancel') ? 'cancelled' : 'error';
      return {
        success: false,
        status,
        filesProcessed: mediaItems.length,
        filesSuccessful: 0,
        error: message,
        code:
          status === 'cancelled'
            ? ErrorCode.CANCELLED
            : message.toLowerCase().includes('all downloads failed')
              ? ErrorCode.ALL_FAILED
              : ErrorCode.UNKNOWN,
      } as DownloadResult & { code: ErrorCode };
    }
  }

  async downloadBulk(
    mediaItems: readonly (MediaItem | MediaInfo)[],
    options: BulkDownloadOptions = {}
  ): Promise<DownloadResult> {
    return this.downloadMultiple(Array.from(mediaItems), options);
  }

  public cancelDownload(): void {
    if (!this.currentAbortController) {
      return;
    }
    this.currentAbortController.abort();
    logger.debug('[BulkDownloadService] Current download cancelled');
    toastManager.info(
      languageService.getString('messages.download.cancelled.title'),
      languageService.getString('messages.download.cancelled.body')
    );
  }

  public isDownloading(): boolean {
    return this.currentAbortController !== undefined;
  }
}

// Singleton instance for testing and direct usage
const _instance = new BulkDownloadService();
export const bulkDownloadService = _instance;
