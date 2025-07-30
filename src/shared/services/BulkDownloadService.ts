/**
 * @fileoverview 간소화된 대량 다운로드 서비스
 * @description 유저스크립트에 적합한 기본 다운로드 기능
 * @version 3.0.0 - Phase B: 간소화
 */

import type { MediaInfo, MediaItem } from '@shared/types/media.types';
import type { BaseService } from '@shared/types/app.types';
import type { MediaItemForFilename } from '@shared/types/media.types';
import { logger } from '@shared/logging/logger';
import { getNativeDownload } from '@shared/external/vendors';
import { getErrorMessage } from '@shared/utils/error-handling';
import { generateMediaFilename } from '@shared/media';

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
}

export interface DownloadResult {
  success: boolean;
  filesProcessed: number;
  filesSuccessful: number;
  error?: string;
  filename?: string;
}

export interface SingleDownloadResult {
  success: boolean;
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
 * 간소화된 대량 다운로드 서비스
 *
 * 주요 기능:
 * - 단일/다중 파일 다운로드
 * - 기본 ZIP 생성
 * - 간단한 진행률 추적
 */
export class BulkDownloadService implements BaseService {
  private static instance: BulkDownloadService;
  private _isInitialized = false;
  private currentAbortController: AbortController | undefined;

  public static getInstance(): BulkDownloadService {
    BulkDownloadService.instance ??= new BulkDownloadService();
    return BulkDownloadService.instance;
  }

  private constructor() {}

  /**
   * BaseService 인터페이스 구현: 서비스 초기화
   */
  public async initialize(): Promise<void> {
    if (this._isInitialized) {
      return;
    }

    logger.info('BulkDownloadService initializing...');
    this._isInitialized = true;
    logger.info('BulkDownloadService initialized');
  }

  /**
   * BaseService 인터페이스 구현: 서비스 정리
   */
  public destroy(): void {
    if (!this._isInitialized) {
      return;
    }

    logger.info('BulkDownloadService destroying...');
    this._isInitialized = false;
    logger.info('BulkDownloadService destroyed');
  }

  /**
   * BaseService 인터페이스 구현: 초기화 상태 확인
   */
  public isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * 서비스 상태 확인 (테스트 호환성을 위해)
   */
  public getStatus(): 'active' | 'inactive' {
    return this._isInitialized ? 'active' : 'inactive';
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
      const blob = await response.blob();
      download.downloadBlob(blob, filename);

      logger.debug(`Downloaded: ${filename}`);
      return { success: true, filename };
    } catch (error) {
      const message = getErrorMessage(error);
      logger.error(`Download failed: ${message}`);
      return { success: false, error: message };
    }
  }

  /**
   * 여러 파일 다운로드 (ZIP 또는 개별)
   */
  public async downloadMultiple(
    mediaItems: Array<MediaInfo | MediaItem> | readonly (MediaInfo | MediaItem)[],
    options: BulkDownloadOptions = {}
  ): Promise<DownloadResult> {
    const items = Array.from(mediaItems);

    if (items.length === 0) {
      return {
        success: false,
        filesProcessed: 0,
        filesSuccessful: 0,
        error: 'No files to download',
      };
    }

    try {
      this.currentAbortController = new AbortController();
      if (options.signal) {
        options.signal.addEventListener('abort', () => {
          this.currentAbortController?.abort();
        });
      }

      // 단일 파일인 경우 개별 다운로드
      if (items.length === 1) {
        const firstItem = items[0];
        if (!firstItem) {
          return {
            success: false,
            filesProcessed: 1,
            filesSuccessful: 0,
            error: 'Invalid media item',
          };
        }

        const result = await this.downloadSingle(firstItem, {
          signal: this.currentAbortController.signal,
        });
        return {
          success: result.success,
          filesProcessed: 1,
          filesSuccessful: result.success ? 1 : 0,
          ...(result.error && { error: result.error }),
          ...(result.filename && { filename: result.filename }),
        };
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
      const { getFflate } = await import('@shared/external/vendors');
      const fflate = getFflate();
      const download = getNativeDownload();

      const files: Record<string, Uint8Array> = {};
      let successful = 0;

      options.onProgress?.({
        phase: 'preparing',
        current: 0,
        total: mediaItems.length,
        percentage: 0,
      });

      // 파일들을 다운로드하여 ZIP에 추가
      for (let i = 0; i < mediaItems.length; i++) {
        if (this.currentAbortController?.signal.aborted) {
          throw new Error('Download cancelled by user');
        }

        const media = mediaItems[i];
        if (!media) continue;

        options.onProgress?.({
          phase: 'downloading',
          current: i + 1,
          total: mediaItems.length,
          percentage: Math.round(((i + 1) / mediaItems.length) * 100),
          filename: media.filename,
        });

        try {
          const response = await fetch(media.url);
          const arrayBuffer = await response.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);

          const converted = toFilenameCompatible(media);
          const filename = generateMediaFilename(converted);
          files[filename] = uint8Array;
          successful++;
        } catch (error) {
          logger.warn(`Failed to download ${media.filename}: ${getErrorMessage(error)}`);
        }
      }

      if (successful === 0) {
        throw new Error('All downloads failed');
      }

      // ZIP 생성
      const zipData = fflate.zipSync(files);
      const zipFilename = options.zipFilename || `download_${Date.now()}.zip`;

      // ZIP 다운로드
      const blob = new Blob([zipData], { type: 'application/zip' });
      download.downloadBlob(blob, zipFilename);

      options.onProgress?.({
        phase: 'complete',
        current: mediaItems.length,
        total: mediaItems.length,
        percentage: 100,
      });

      logger.debug(
        `ZIP download complete: ${zipFilename} (${successful}/${mediaItems.length} files)`
      );

      return {
        success: true,
        filesProcessed: mediaItems.length,
        filesSuccessful: successful,
        filename: zipFilename,
      };
    } catch (error) {
      const message = getErrorMessage(error);
      logger.error(`ZIP download failed: ${message}`);
      return {
        success: false,
        filesProcessed: mediaItems.length,
        filesSuccessful: 0,
        error: message,
      };
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
  }

  /**
   * 현재 다운로드 중인지 확인
   */
  public isDownloading(): boolean {
    return this.currentAbortController !== undefined;
  }
}
