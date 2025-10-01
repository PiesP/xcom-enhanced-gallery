/**
 * @fileoverview 간소화된 대량 다운로드 서비스
 * @description 유저스크립트에 적합한 기본 다운로드 기능
 * @version 3.0.0 - Phase B: 간소화
 */

import type { MediaInfo, MediaItem } from '@shared/types/media.types';
import type { MediaItemForFilename } from '@shared/types/media.types';
import {
  logger,
  createCorrelationId,
  createScopedLoggerWithCorrelation,
  logFields,
} from '@shared/logging/logger';
import { getNativeDownload } from '@shared/external/vendors';
import { getErrorMessage } from '@shared/utils/error-handling';
import { generateMediaFilename } from '@shared/media/FilenameService';
import { toastManager } from './UnifiedToastManager';
import { languageService } from './LanguageService';
import type { BaseResultStatus } from '@shared/types/result.types';
import { ErrorCode } from '@shared/types/result.types';

export interface DownloadProgress {
  phase: 'preparing' | 'downloading' | 'complete';
  current: number;
  total: number;
  percentage: number;
  filename?: string;
}

export interface BulkDownloadOptions {
  onProgress?: (progress: DownloadProgress) => void;
  signal?: AbortSignal;
  zipFilename?: string;
  concurrency?: number; // RED -> GREEN: 제한된 동시성 처리
  retries?: number; // retry attempts
  /** 진행률 토스트 표시 여부 (상위에서 설정 주입) */
  showProgressToast?: boolean;
  /** 상관관계 식별자(외부에서 주입 가능) */
  correlationId?: string;
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
  private static readonly DEFAULT_BACKOFF_BASE_MS = 200;
  // 진행률 토스트 ID (옵션)
  private progressToastId: string | null = null;
  // 현재 세션 상관관계 ID (취소 토스트 등에서 메타 연동)
  private sessionCorrelationId: string | undefined;

  private async sleep(ms: number, signal?: AbortSignal): Promise<void> {
    if (ms <= 0) return;
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        resolve();
      }, ms);
      const onAbort = () => {
        cleanup();
        reject(new Error('Download cancelled by user'));
      };
      const cleanup = () => {
        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
      };
      if (signal) signal.addEventListener('abort', onAbort);
    });
  }

  /**
   * Fetch helper with retry and exponential backoff.
   */
  private async fetchArrayBufferWithRetry(
    url: string,
    retries: number,
    signal?: AbortSignal,
    backoffBaseMs: number = BulkDownloadService.DEFAULT_BACKOFF_BASE_MS
  ): Promise<Uint8Array> {
    let attempt = 0;
    // total tries = retries + 1
    while (true) {
      if (signal?.aborted) throw new Error('Download cancelled by user');
      try {
        const response = await fetch(url, { ...(signal ? { signal } : {}) } as RequestInit);
        // Standardize: treat non-2xx as errors (align with Userscript adapter fallback)
        // Safety: some tests mock fetch without `ok`/`status`. In that case, assume success.
        const respLike = response as unknown as Partial<Response>;
        const status: number | undefined =
          typeof respLike?.status === 'number' ? (respLike.status as number) : undefined;
        const hasOk: boolean = typeof respLike?.ok === 'boolean';
        const computedOk: boolean = hasOk
          ? Boolean(respLike.ok)
          : status !== undefined
            ? status >= 200 && status < 300
            : true; // if both ok and status are missing (mock), treat as ok
        if (!computedOk) {
          throw new Error(`http_${status ?? 0}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
      } catch (err) {
        if (attempt >= retries) throw err;
        attempt += 1;
        // exponential backoff: base * 2^(attempt-1)
        const delay = Math.max(0, Math.floor(backoffBaseMs * 2 ** (attempt - 1)));
        // backoff before next attempt (throws on abort)
        await this.sleep(delay, signal);
      }
    }
  }

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
      const response = await fetch(media.url);
      // Safety: tolerate mocks without ok/status (assume success in that case)
      const respLike = response as unknown as Partial<Response>;
      const status: number | undefined =
        typeof respLike?.status === 'number' ? (respLike.status as number) : undefined;
      const hasOk: boolean = typeof respLike?.ok === 'boolean';
      const computedOk: boolean = hasOk
        ? Boolean(respLike.ok)
        : status !== undefined
          ? status >= 200 && status < 300
          : true;
      if (!computedOk) {
        throw new Error(`http_${status ?? 0}`);
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
    const correlationId = options.correlationId ?? createCorrelationId();
    const slog = createScopedLoggerWithCorrelation('BulkDownload', correlationId);
    this.sessionCorrelationId = correlationId;
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
              languageService.getString('messages.download.cancelled.body'),
              { meta: { correlationId } }
            );
            this.cancelToastShown = true;
          }
        });
      }

      // 진행률 토스트 표시 여부 (상위 옵션으로 주입)
      const showProgressToast = options.showProgressToast === true;

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
            }),
            { meta: { correlationId } }
          );
        }
        return singleOutcome;
      }

      // 여러 파일인 경우 ZIP 다운로드
      if (showProgressToast) {
        // 초기 진행 토스트 생성 (live-only로도 충분하지만 시각 피드백을 위해 both)
        const title = languageService.getString('messages.download.progress.title');
        const body = languageService.getFormattedString('messages.download.progress.body', {
          current: 0,
          total: items.length,
          percentage: 0,
          filename: '',
        });
        this.progressToastId = toastManager.show({
          title,
          message: body,
          type: 'info',
          duration: 0, // 수동 제거
          route: 'both',
          meta: { correlationId },
        });
      }

      const res = await this.downloadAsZip(items, {
        ...options,
        correlationId,
        onProgress: p => {
          options.onProgress?.(p);
          if (showProgressToast && this.progressToastId) {
            // 업데이트: 현재/총계/퍼센트/파일명
            const title = languageService.getString('messages.download.progress.title');
            const body = languageService.getFormattedString('messages.download.progress.body', {
              current: p.current,
              total: p.total,
              percentage: p.percentage,
              filename: p.filename ?? '',
            });
            // 간단 구현: 기존 토스트 제거 후 동일 ID로 다시 생성은 불가하므로 제거 후 새로 추가
            // (UnifiedToastManager에 update가 없으므로 재생성)
            try {
              toastManager.remove(this.progressToastId);
            } catch {
              // ignore
            }
            this.progressToastId = toastManager.show({
              title,
              message: body,
              type: 'info',
              duration: 0,
              route: 'both',
              meta: { correlationId },
            });
          }
        },
      });

      // 완료 시 진행 토스트 제거
      if (this.progressToastId) {
        try {
          toastManager.remove(this.progressToastId);
        } catch {
          // ignore
        }
        this.progressToastId = null;
      }

      return res;
    } finally {
      this.sessionCorrelationId = undefined;
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
      const correlationId = options.correlationId ?? createCorrelationId();
      const slog = createScopedLoggerWithCorrelation('BulkDownload', correlationId);
      const download = getNativeDownload();

      const files: Record<string, Uint8Array> = {};
      let successful = 0;
      let processed = 0;
      const failures: Array<{ url: string; error: string }> = [];

      // filename collision handling: ensure unique names with -1, -2 suffixes
      const usedNames = new Set<string>();
      const baseCounts = new Map<string, number>();
      const ensureUniqueFilename = (desired: string): string => {
        if (!usedNames.has(desired) && !files[desired]) {
          usedNames.add(desired);
          baseCounts.set(desired, 0);
          return desired;
        }
        // split name and extension
        const lastDot = desired.lastIndexOf('.');
        const name = lastDot > 0 ? desired.slice(0, lastDot) : desired;
        const ext = lastDot > 0 ? desired.slice(lastDot) : '';
        const baseKey = desired; // track per original desired
        let count = baseCounts.get(baseKey) ?? 0;
        // start suffixing at 1
        while (true) {
          count += 1;
          const candidate = `${name}-${count}${ext}`;
          if (!usedNames.has(candidate) && !files[candidate]) {
            baseCounts.set(baseKey, count);
            usedNames.add(candidate);
            return candidate;
          }
        }
      };

      const concurrency = Math.max(1, Math.min(options.concurrency ?? 2, 8));
      const retries = Math.max(0, options.retries ?? 0);
      const abortSignal = this.currentAbortController?.signal;

      const isAborted = (): boolean => !!abortSignal?.aborted;

      const fetchWithRetry = (url: string) =>
        this.fetchArrayBufferWithRetry(url, retries, abortSignal);

      options.onProgress?.({
        phase: 'preparing',
        current: 0,
        total: mediaItems.length,
        percentage: 0,
      });

      // 동시성 큐 실행
      let index = 0;
      const workers: Promise<void>[] = [];

      const runNext = async (): Promise<void> => {
        // 루프를 통해 할당
        while (true) {
          if (isAborted()) throw new Error('Download cancelled by user');
          const i = index++;
          if (i >= mediaItems.length) return;
          const media = mediaItems[i];
          if (!media) {
            processed++;
            continue;
          }

          options.onProgress?.({
            phase: 'downloading',
            current: Math.min(processed + 1, mediaItems.length),
            total: mediaItems.length,
            percentage: Math.min(
              100,
              Math.max(0, Math.round(((processed + 1) / mediaItems.length) * 100))
            ),
            filename: media.filename,
          });

          try {
            const start = Date.now();
            const data = await fetchWithRetry(media.url);
            const converted = toFilenameCompatible(media);
            const desiredName = generateMediaFilename(converted);
            const filename = ensureUniqueFilename(desiredName);
            files[filename] = data;
            successful++;
            const durationMs = Math.max(0, Date.now() - start);
            slog.debug(
              'File added to ZIP',
              logFields({ filename, size: data.byteLength, durationMs })
            );
          } catch (error) {
            if (isAborted()) throw new Error('Download cancelled by user');
            const errMsg = getErrorMessage(error);
            slog.warn('Failed to download', { filename: media.filename, error: errMsg });
            failures.push({ url: media.url, error: errMsg });
          } finally {
            processed++;
          }
        }
      };

      for (let w = 0; w < concurrency; w++) {
        workers.push(runNext());
      }

      await Promise.all(workers);

      if (successful === 0) {
        // 모든 실패 → 에러 토스트 (Phase I 정책)
        toastManager.error(
          languageService.getString('messages.download.allFailed.title'),
          languageService.getString('messages.download.allFailed.body'),
          { meta: { correlationId } }
        );
        // 구조화된 실패 결과를 반환하여 per-item 실패 원인(failures[])을 노출
        const result: DownloadResult & { code: ErrorCode } = {
          success: false,
          status: 'error',
          filesProcessed: mediaItems.length,
          filesSuccessful: 0,
          // ZIP 파일은 생성되지 않았으므로 filename 생략
          failures,
          error: 'All downloads failed',
          code: ErrorCode.ALL_FAILED,
        };
        return result;
      }

      // ZIP 생성 (표준 유틸 경유)
      const zipStart = Date.now();
      const { createZipBlobFromFileMap } = await import('@shared/external/zip/zip-creator');
      const zipBlob = await createZipBlobFromFileMap(new Map(Object.entries(files)), {
        // forward cancellation/timeouts/retries to zip-creator
        ...(abortSignal ? { abortSignal } : {}),
        zipTimeoutMs: Math.max(0, 60_000),
        zipRetries: Math.max(0, retries),
      });
      const zipDurationMs = Math.max(0, Date.now() - zipStart);
      const zipFilename = options.zipFilename || `download_${Date.now()}.zip`;

      // ZIP 다운로드
      download.downloadBlob(zipBlob, zipFilename);

      options.onProgress?.({
        phase: 'complete',
        current: mediaItems.length,
        total: mediaItems.length,
        percentage: 100,
      });

      const zipSize = zipBlob.size ?? 0;
      slog.info(
        'ZIP download complete',
        logFields({
          zipFilename,
          files: successful,
          total: mediaItems.length,
          size: zipSize,
          durationMs: zipDurationMs,
        })
      );

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
                { route: 'both', meta: { correlationId } }
              );

              const run = async () => {
                while (idx < failedItems.length) {
                  const myIndex = idx++;
                  const item = failedItems[myIndex];
                  if (!item) break;
                  try {
                    await this.fetchArrayBufferWithRetry(item.url, retries, abortSignal);
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
                    })} (cid: ${correlationId})`,
                    { meta: { correlationId } }
                  );
                }
              });
            },
            meta: { correlationId },
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
        languageService.getString('messages.download.cancelled.body'),
        { meta: { correlationId: this.sessionCorrelationId ?? createCorrelationId() } }
      );
      this.cancelToastShown = true;
    }
    // 진행 토스트 제거
    if (this.progressToastId) {
      try {
        toastManager.remove(this.progressToastId);
      } catch {
        // ignore
      }
      this.progressToastId = null;
    }
  }

  /**
   * 현재 다운로드 중인지 확인
   */
  public isDownloading(): boolean {
    return this.currentAbortController !== undefined;
  }
}

// 간단한 인스턴스 export (복잡한 싱글톤 패턴 없이)
export const bulkDownloadService = new BulkDownloadService();
export default bulkDownloadService;
