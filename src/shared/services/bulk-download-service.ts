/** Bulk download service - ZIP/individual download */

import type { MediaInfo } from '../types/media.types';
import type { MediaItemForFilename } from '../types/media.types';
import { logger, createCorrelationId, createScopedLoggerWithCorrelation } from '@shared/logging';
import { getNativeDownload } from '../external/vendors';
import { getErrorMessage } from '../utils/error-handling';
import { generateMediaFilename } from './file-naming';
import { toastManager } from './unified-toast-manager';
import { languageService } from './language-service';
import type { BaseResultStatus } from '../types/result.types';
import { ErrorCode } from '../types/result.types';
import { DownloadOrchestrator } from './download/download-orchestrator';
import { HttpRequestService } from './http-request-service';
import type { DownloadProgress } from './download/types';
import { BaseServiceImpl } from './base-service';

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

/**
 * Phase 313: BulkDownloadService 가용성 확인 결과
 * HttpRequestService + DownloadService 의존성 포함
 */
export interface BulkDownloadAvailabilityResult {
  /** 서비스 가용성 여부 */
  available: boolean;

  /** 감지된 환경 ('Tampermonkey', 'Test', 'Extension', 'Console') */
  environment: string;

  /** 사용자 친화적 메시지 */
  message: string;

  /** 시뮬레이션 가능 여부 */
  canSimulate: boolean;

  /** 의존 서비스 상태 */
  dependencies: {
    downloadService: {
      available: boolean;
      reason?: string;
    };
    httpService: {
      available: boolean;
      reason?: string;
    };
  };
}

/**
 * Phase 313: 대량 다운로드 시뮬레이션 결과
 */
export interface SimulatedBulkDownloadResult {
  success: boolean;
  filesProcessed: number;
  filesSimulated: number;
  filenames: string[];
  error?: string;
  message: string;
}

function ensureMediaItem(media: MediaInfo): MediaInfo & { id: string } {
  return {
    ...media,
    id: media.id || `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
}

function toFilenameCompatible(media: MediaInfo): MediaItemForFilename {
  const ensured = ensureMediaItem(media);
  const result: MediaItemForFilename = { id: ensured.id, url: ensured.url, type: ensured.type };

  // Optional props assigned only when present (exactOptionalPropertyTypes)
  if (ensured.originalUrl) result.originalUrl = ensured.originalUrl;
  if (ensured.filename) result.filename = ensured.filename;
  if (ensured.tweetUsername) result.tweetUsername = ensured.tweetUsername;
  if (ensured.tweetId) result.tweetId = ensured.tweetId;

  return result;
}

export class BulkDownloadService extends BaseServiceImpl {
  private currentAbortController: AbortController | undefined;

  constructor() {
    super('BulkDownloadService');
  }

  /** Initialize service (BaseServiceImpl template method) */
  protected onInitialize(): void {
    // No initialization needed
  }

  /** Cleanup service (BaseServiceImpl template method) */
  protected onDestroy(): void {
    this.currentAbortController?.abort();
  }

  public async downloadSingle(
    media: MediaInfo,
    options: { signal?: AbortSignal } = {}
  ): Promise<SingleDownloadResult> {
    try {
      const httpService = HttpRequestService.getInstance();
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
      const httpOptions = {
        responseType: 'blob' as const,
        timeout: 20000,
        ...(signal ? { signal } : {}),
      };
      const response = await httpService.get<Blob>(media.url, httpOptions);
      if (!response.ok) throw new Error(`HTTP ${response.status}: error`);
      const blob = response.data;
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
    mediaItems: Array<MediaInfo> | readonly MediaInfo[],
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
    mediaItems: Array<MediaInfo>,
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
    mediaItems: readonly MediaInfo[],
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

  /**
   * Phase 313: BulkDownloadService 가용성 확인
   *
   * HttpRequestService와 DownloadService의 의존성을 확인합니다.
   * 테스트 환경과 프로덕션 환경을 구분합니다.
   *
   * @returns {Promise<BulkDownloadAvailabilityResult>} 가용성 확인 결과
   *
   * @example
   * const result = await service.validateAvailability();
   * if (result.available) {
   *   console.log(`✅ 대량 다운로드 가능: ${result.environment} 환경`);
   * }
   */
  async validateAvailability(): Promise<BulkDownloadAvailabilityResult> {
    const { detectEnvironment } = await import('@shared/external/userscript');
    const env = detectEnvironment();

    // HttpRequestService 가용성 확인
    const httpService = HttpRequestService.getInstance();
    const httpAvailability = await httpService.validateAvailability();

    // DownloadService 의존성 확인 (GM_download)
    const gmDownload = (globalThis as Record<string, unknown>).GM_download;
    const downloadAvailable = !!gmDownload || env.isTestEnvironment;

    const available = httpAvailability.available && downloadAvailable;
    const canSimulate = env.isTestEnvironment || !gmDownload;

    return {
      available,
      environment: env.environment,
      message: available
        ? `✅ 대량 다운로드 서비스 준비됨 (${env.environment} 환경, ${available ? '프로덕션' : '테스트'})`
        : `⚠️ 대량 다운로드 서비스 불가용 (${env.environment} 환경)`,
      canSimulate,
      dependencies: {
        httpService: {
          available: httpAvailability.available,
          reason: httpAvailability.message,
        },
        downloadService: {
          available: downloadAvailable,
          reason: gmDownload ? 'GM_download available' : 'Test environment',
        },
      },
    };
  }

  /**
   * Phase 313: 대량 다운로드 시뮬레이션
   *
   * 실제 다운로드 없이 여러 미디어 아이템의 다운로드를 시뮬레이션합니다.
   * 각 아이템마다 100-300ms의 네트워크 지연을 포함합니다.
   *
   * @param mediaItems - 다운로드할 미디어 정보 배열
   * @param options - 다운로드 옵션 (신호, 지연 등)
   * @returns {Promise<SimulatedBulkDownloadResult>} 시뮬레이션 결과
   *
   * @example
   * const media: MediaInfo[] = [
   *   { id: '1', url: '...', type: 'image', tweetId: '123' },
   *   { id: '2', url: '...', type: 'video', tweetId: '456' },
   * ];
   *
   * const result = await service.simulateBulkDownload(media);
   * // {
   * //   success: true,
   * //   filesProcessed: 2,
   * //   filesSimulated: 2,
   * //   filenames: ['user_123_image.jpg', 'user_456_video.mp4']
   * // }
   */
  async simulateBulkDownload(
    mediaItems: MediaInfo[],
    options: BulkDownloadOptions = {}
  ): Promise<SimulatedBulkDownloadResult> {
    const filenames: string[] = [];
    let filesSimulated = 0;

    try {
      // 취소 신호 확인
      if (options.signal?.aborted) {
        return {
          success: false,
          filesProcessed: 0,
          filesSimulated: 0,
          filenames: [],
          error: '시뮬레이션 취소됨 (사용자 요청)',
          message: '❌ 시뮬레이션이 취소되었습니다.',
        };
      }

      // 각 미디어 아이템마다 시뮬레이션
      for (const media of mediaItems) {
        if (options.signal?.aborted) break;

        try {
          // 네트워크 지연 시뮬레이션 (100-300ms)
          const delay = Math.random() * 200 + 100;
          await new Promise(resolve => globalThis.setTimeout(resolve, delay));

          // 파일명 생성
          const converted = toFilenameCompatible(media);
          const filename = generateMediaFilename(converted);
          filenames.push(filename);
          filesSimulated++;
        } catch (itemError) {
          logger.warn(
            `시뮬레이션 아이템 실패: ${itemError instanceof Error ? itemError.message : '알 수 없음'}`
          );
        }
      }

      return {
        success: filesSimulated > 0,
        filesProcessed: mediaItems.length,
        filesSimulated,
        filenames,
        message: `✅ ${filesSimulated}/${mediaItems.length} 아이템 시뮬레이션 완료`,
      };
    } catch (error) {
      return {
        success: false,
        filesProcessed: mediaItems.length,
        filesSimulated,
        filenames,
        error: error instanceof Error ? error.message : '시뮬레이션 실패',
        message: '❌ 대량 다운로드 시뮬레이션 중 오류 발생',
      };
    }
  }
}

// Singleton instance for testing and direct usage
const _instance = new BulkDownloadService();
export const bulkDownloadService = _instance;
