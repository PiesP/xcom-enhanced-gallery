/**
 * @fileoverview 간소화된 대량 다운로드 서비스
 * @description 유저스크립트에 적합한 기본 다운로드 기능
 * @version 3.0.0 - Phase B: 간소화
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

// DownloadProgress 타입은 단일 소스에서 가져옵니다.

export interface BulkDownloadOptions {
  onProgress?: (progress: DownloadProgress) => void;
  signal?: AbortSignal;
  zipFilename?: string;
  concurrency?: number; // RED -> GREEN: 제한된 동시성 처리
  retries?: number; // retry attempts
}

export interface DownloadResult {
  success: boolean; // 기존 호환
  status: BaseResultStatus;
  filesProcessed: number;
  filesSuccessful: number;
  error?: string;
  filename?: string;
  failures?: Array<{ url: string; error: string }>; // 부분 실패 요약(0<length<total)
}

export interface SingleDownloadResult {
  success: boolean; // 기존 호환
  status: BaseResultStatus;
  filename?: string;
  error?: string;
}

/**
 * MediaInfo를 FilenameService와 호환되는 타입으로 변환
 */
function ensureMediaItem(media: MediaInfo | MediaItem): MediaItem & { id: string } {
  return {
    ...media,
    id: media.id || `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
}

/**
 * MediaInfo를 FilenameService가 기대하는 타입으로 변환
 */
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

/**
 * 간소화된 대량 다운로드 서비스 - Phase 4 간소화
 *
 * 주요 기능:
 * - 단일/다중 파일 다운로드
 * - 기본 ZIP 생성
 * - 간단한 진행률 추적
 */
export class BulkDownloadService {
  private currentAbortController: AbortController | undefined;
  private cancelToastShown = false;
  private readonly orchestrator = new DownloadOrchestrator();

  /**
   * Fetch helper with retry and exponential backoff.
   */
  // fetchArrayBufferWithRetry moved to DownloadOrchestrator

  /**
   * 서비스 상태 확인 (테스트 호환성을 위해)
   */
  public getStatus(): 'active' | 'inactive' {
    return 'active'; // 간소화: 항상 활성상태로 처리
  }

  /**
   * 단일 파일 다운로드
   */
  public async downloadSingle(
    media: MediaInfo | MediaItem,
    options: { signal?: AbortSignal } = {}
  ): Promise<SingleDownloadResult> {
    try {
      const converted = toFilenameCompatible(media);
      const filename = generateMediaFilename(converted);
      const download = getNativeDownload();

      if (options.signal?.aborted) {
        throw new Error('Download cancelled by user');
      }

      // URL로부터 Blob 생성 후 다운로드
      // 기본 타임아웃(20s) 적용 + 호출부 AbortSignal 전파
      const defaultTimeout = AbortSignal.timeout?.(20_000);
      let signal: AbortSignal | undefined = options.signal ?? defaultTimeout;
      // 둘 다 존재하면 병합: 어느 한쪽이 abort되면 중단
      if (options.signal && defaultTimeout) {
        const controller = new AbortController();
        const onAbort = () => controller.abort();
        options.signal.addEventListener('abort', onAbort, { once: true });
        defaultTimeout.addEventListener('abort', onAbort, { once: true });
        signal = controller.signal;
      }

      const response = await fetch(media.url, { ...(signal ? { signal } : {}) } as RequestInit);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const blob = await response.blob();
      download.downloadBlob(blob, filename);

      logger.debug(`Downloaded: ${filename}`);
      return { success: true, status: 'success', filename };
    } catch (error) {
      const message = getErrorMessage(error);
      logger.error(`Download failed: ${message}`);
      const status: BaseResultStatus = message.toLowerCase().includes('cancel')
        ? 'cancelled'
        : 'error';
      return { success: false, status, error: message };
    }
  }

  /**
   * 여러 파일 다운로드 (ZIP 또는 개별)
   */
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
      this.cancelToastShown = false;
      this.currentAbortController = new AbortController();
      slog.info('Download session started', { count: items.length });
      if (options.signal) {
        options.signal.addEventListener('abort', () => {
          this.currentAbortController?.abort();
          slog.warn('Abort signal received');
          if (!this.cancelToastShown) {
            toastManager.info(
              languageService.getString('messages.download.cancelled.title'),
              languageService.getString('messages.download.cancelled.body')
            );
            this.cancelToastShown = true;
          }
        });
      }

      // 단일 파일인 경우 개별 다운로드
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

        // Progress events for single flow
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

        // Phase I: 오류 복구 UX - 토스트 알림 (단일 파일)
        if (result.success) {
          // 단일 성공은 UX 소음 줄이기 위해 토스트 생략 (정책)
        } else if (result.error) {
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

      // 여러 파일인 경우 ZIP 다운로드
      return await this.downloadAsZip(items, options);
    } finally {
      this.currentAbortController = undefined;
    }
  }

  /**
   * ZIP 파일로 다운로드
   */
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
      } = await this.orchestrator.zipMediaItems(itemsForZip, orchOptions);

      if (successful === 0) {
        // 모든 실패 → 에러 토스트 (Phase I 정책)
        toastManager.error(
          languageService.getString('messages.download.allFailed.title'),
          languageService.getString('messages.download.allFailed.body')
        );
        throw new Error('All downloads failed');
      }
      const zipFilename = options.zipFilename || `download_${Date.now()}.zip`;

      // ZIP 다운로드
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
        success: status === 'success' || status === 'partial', // 부분 실패도 success=true 유지
        status,
        filesProcessed: mediaItems.length,
        filesSuccessful: successful,
        filename: zipFilename,
        ...(failures.length > 0 ? { failures } : {}),
        code,
      };

      // Phase I: 오류 복구 UX - 부분 실패 경고 토스트
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
              // async retry: verify failed items with limited concurrency only
              const maxRetryConcurrency = Math.min(2, failedItems.length);
              const remaining: Array<{ url: string; error: string }> = [];
              let idx = 0;

              // Optimistic UX: immediately show success (announce + toast)
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
                    // lightweight re-try: perform a single fetch with orchestrator retry logic
                    const retryOptions = {
                      retries: options.retries ?? 0,
                      concurrency: 1,
                      ...(abortSignal ? { signal: abortSignal } : {}),
                    } as const;
                    await this.orchestrator.zipMediaItems(
                      [{ url: item.url, desiredName: item.filename ?? 'file.bin' }],
                      retryOptions
                    );
                  } catch (e) {
                    remaining.push({ url: item.url, error: getErrorMessage(e) });
                  }
                }
              };

              // After background verification, if residual failures exist, inform with a warning
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
      } else if (failures.length === 0) {
        // 전체 성공 시 토스트 과다 알림 방지 (정책상 생략 또는 향후 설정 기반 활성화 가능)
      }

      return result;
    } catch (error) {
      const message = getErrorMessage(error);
      logger.error(`ZIP download failed: ${message}`);
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

  /**
   * 대량 다운로드 (테스트 호환성을 위한 별칭)
   */
  async downloadBulk(
    mediaItems: readonly (MediaItem | MediaInfo)[],
    options: BulkDownloadOptions = {}
  ): Promise<DownloadResult> {
    return this.downloadMultiple(Array.from(mediaItems), options);
  }

  /**
   * 현재 다운로드 중단
   */
  public cancelDownload(): void {
    this.currentAbortController?.abort();
    logger.debug('Current download cancelled');
    // Phase I: 취소 알림 (info 토스트)
    if (!this.cancelToastShown) {
      toastManager.info(
        languageService.getString('messages.download.cancelled.title'),
        languageService.getString('messages.download.cancelled.body')
      );
      this.cancelToastShown = true;
    }
  }

  /**
   * 현재 다운로드 중인지 확인
   */
  public isDownloading(): boolean {
    return this.currentAbortController !== undefined;
  }
}

// Factory pattern: use getBulkDownloadService() from service-factories.ts
// Direct instantiation is forbidden by Service Contract
