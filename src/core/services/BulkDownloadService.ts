/**
 * @fileoverview Bulk Download Service - Core Business Logic
 * @version 2.0.0
 * @follows Clean Architecture Pattern
 *
 * Core layer에 위치한 대량 다운로드 서비스입니다.
 * 여러 미디어 파일의 일괄 다운로드 비즈니스 로직을 중앙 집중화하여 일관성을 보장합니다.
 */

import type { MediaInfo, MediaItem } from '@core/types/media.types';
import type { BaseService } from '@core/types/services.types';
import type { MediaItemForFilename } from '@core/types/media.types';
import { logger } from '@core/logging/logger';
import { getNativeDownload } from '@infrastructure/external/vendors';
import { createZipFromItems, type MediaItemForZip } from '@infrastructure/external/zip';
import { generateMediaFilename, generateZipFilename } from '@infrastructure/media';

export interface DownloadProgress {
  phase: 'preparing' | 'downloading' | 'zipping' | 'complete';
  current: number;
  total: number;
  percentage: number;
  filename?: string;
}

export interface DownloadOptions {
  onProgress?: (progress: DownloadProgress) => void;
  signal?: AbortSignal;
  zipFilename?: string;
  strategy?: 'auto' | 'zip' | 'individual';
  includeImages?: boolean;
  includeVideos?: boolean;
  maxFiles?: number;
  compressionLevel?: number;
  includeMetadata?: boolean;
}

export interface DownloadResult {
  success: boolean;
  filesProcessed: number;
  filesSuccessful: number;
  error?: string;
  filename?: string;
}

export interface DownloadInfo {
  isDownloading: boolean;
  currentItem?: string;
  progress: number;
  failedFiles: string[];
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
    originalUrl: ensured.originalUrl,
    type: ensured.type,
    filename: ensured.filename,
    tweetUsername: ensured.tweetUsername,
    tweetId: ensured.tweetId,
  };
}

/**
 * 대량 다운로드 서비스 - Core Business Logic
 *
 * Clean Architecture 원칙을 따라 core layer에서 비즈니스 로직을 관리합니다.
 * Singleton 패턴으로 전역 상태 관리 및 일관된 대량 다운로드 처리를 보장합니다.
 */
export class BulkDownloadService implements BaseService {
  private static instance: BulkDownloadService;
  private _isInitialized = false;
  private currentAbortController: AbortController | undefined;
  private readonly downloadInfo: DownloadInfo = {
    isDownloading: false,
    progress: 0,
    failedFiles: [],
  };

  // Core configuration constants
  private static readonly CONFIG = {
    ZIP_COMPRESSION_LEVEL: 6,
    MAX_FILE_SIZE_MB: 100,
    REQUEST_TIMEOUT_MS: 30000,
    DEFAULT_CONCURRENT_DOWNLOADS: 3,
    RATE_LIMIT_DELAY_MS: 500,
  } as const;

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
   * 단일 미디어 다운로드
   * @param media - 다운로드할 미디어 아이템
   * @returns 다운로드 성공 여부
   */
  async downloadSingle(media: MediaItem | MediaInfo): Promise<SingleDownloadResult> {
    try {
      const result = await this.downloadSingleWithIndex(media);
      if (result) {
        return {
          success: true,
          filename: generateMediaFilename(toFilenameCompatible(media)),
        };
      } else {
        return {
          success: false,
          error: 'Download failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 대량 다운로드 (테스트 호환성을 위한 별칭)
   */
  async downloadBulk(
    mediaItems: readonly (MediaItem | MediaInfo)[],
    options: DownloadOptions = {}
  ): Promise<DownloadResult> {
    return this.downloadMultiple(mediaItems, options);
  }

  /**
   * 다운로드 취소
   */
  public cancelDownload(): void {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
    }
    this.currentAbortController = undefined;
    this.downloadInfo.isDownloading = false;
    logger.info('Download cancelled');
  }

  /**
   * 현재 다운로드 정보 반환
   */
  public getCurrentDownloadInfo(): DownloadInfo {
    return { ...this.downloadInfo };
  }

  /**
   * 인덱스를 지정한 단일 미디어 다운로드
   * @param media - 다운로드할 미디어 아이템
   * @param index - 파일명 생성에 사용할 인덱스 (1-based)
   * @returns 다운로드 성공 여부
   */
  private async downloadSingleWithIndex(
    media: MediaItem | MediaInfo,
    index?: number
  ): Promise<boolean> {
    try {
      const downloader = getNativeDownload();
      const url = this.extractSafeUrl(media);
      const filename = generateMediaFilename(
        toFilenameCompatible(media),
        index ? { index } : undefined
      );

      logger.info('Starting single media download:', { url, filename });

      const response = await fetch(url);
      logger.info('Fetch response:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      logger.info('Blob created:', {
        size: blob.size,
        type: blob.type,
      });

      downloader.downloadBlob(blob, filename);
      logger.info('downloadBlob called successfully');

      logger.info('Single media download completed:', filename);
      return true;
    } catch (error) {
      logger.info('Download failed with error:', error);
      logger.error('Single media download failed:', error);
      return false;
    }
  }

  /**
   * 여러 미디어 다운로드 (전략 자동 선택)
   * @param mediaItems - 다운로드할 미디어 아이템 배열
   * @param options - 다운로드 옵션
   * @returns 다운로드 결과
   */
  async downloadMultiple(
    mediaItems: readonly (MediaItem | MediaInfo)[],
    options: DownloadOptions = {}
  ): Promise<DownloadResult> {
    try {
      if (mediaItems.length === 0) {
        return {
          success: false,
          filesProcessed: 0,
          filesSuccessful: 0,
          error: 'No media items provided',
        };
      }

      const strategy = options.strategy ?? this.determineOptimalStrategy(mediaItems);

      switch (strategy) {
        case 'zip':
          return await this.downloadAsZip(mediaItems, options);
        case 'individual':
          return await this.downloadIndividually(mediaItems, options);
        default:
          // Auto strategy selection
          return mediaItems.length > 1
            ? await this.downloadAsZip(mediaItems, options)
            : await this.downloadIndividually(mediaItems, options);
      }
    } catch (error) {
      logger.error('Multiple media download failed:', error);
      return {
        success: false,
        filesProcessed: mediaItems.length,
        filesSuccessful: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * ZIP 파일로 일괄 다운로드
   */
  private async downloadAsZip(
    mediaItems: readonly (MediaItem | MediaInfo)[],
    options: DownloadOptions = {}
  ): Promise<DownloadResult> {
    const { onProgress, zipFilename } = options;

    try {
      logger.info(`Starting ZIP download for ${mediaItems.length} items`);

      // Progress callback for ZIP creation
      const progressCallback = (progress: number): void => {
        onProgress?.({
          phase: progress < 0.7 ? 'downloading' : 'zipping',
          current: Math.floor(progress * mediaItems.length),
          total: mediaItems.length,
          percentage: Math.round(progress * 100),
        });
      };

      // Prepare items for ZIP creation
      const zipItems: MediaItemForZip[] = mediaItems.map((item, index) => ({
        url: this.extractSafeUrl(item),
        originalUrl: this.extractSafeUrl(item),
        filename: generateMediaFilename(toFilenameCompatible(item), { index: index + 1 }),
      }));

      const finalZipFilename =
        zipFilename ?? generateZipFilename(mediaItems.map(item => toFilenameCompatible(item)));

      onProgress?.({
        phase: 'preparing',
        current: 0,
        total: mediaItems.length,
        percentage: 0,
      });

      // Create ZIP with core configuration
      const zipBlob = (await createZipFromItems(zipItems, finalZipFilename, progressCallback, {
        compressionLevel: BulkDownloadService.CONFIG.ZIP_COMPRESSION_LEVEL,
        maxFileSize: BulkDownloadService.CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024,
        requestTimeout: BulkDownloadService.CONFIG.REQUEST_TIMEOUT_MS,
        maxConcurrent: BulkDownloadService.CONFIG.DEFAULT_CONCURRENT_DOWNLOADS,
      })) as Blob;

      // Download the ZIP file
      const downloader = getNativeDownload();
      downloader.downloadBlob(zipBlob, finalZipFilename);

      onProgress?.({
        phase: 'complete',
        current: mediaItems.length,
        total: mediaItems.length,
        percentage: 100,
      });

      logger.info('ZIP download completed successfully:', finalZipFilename);
      return {
        success: true,
        filesProcessed: mediaItems.length,
        filesSuccessful: mediaItems.length,
        filename: finalZipFilename,
      };
    } catch (error) {
      logger.error('ZIP download failed:', error);
      return {
        success: false,
        filesProcessed: mediaItems.length,
        filesSuccessful: 0,
        error: error instanceof Error ? error.message : 'ZIP download failed',
      };
    }
  }

  /**
   * 개별 파일 다운로드
   */
  private async downloadIndividually(
    mediaItems: readonly (MediaItem | MediaInfo)[],
    options: DownloadOptions = {}
  ): Promise<DownloadResult> {
    const { onProgress, signal } = options;
    let successCount = 0;

    try {
      logger.info(`Starting individual downloads for ${mediaItems.length} items`);

      for (let i = 0; i < mediaItems.length; i++) {
        const item = mediaItems[i];
        if (!item) {
          continue;
        }

        // Check for cancellation
        if (signal?.aborted) {
          logger.info('Download cancelled by user');
          break;
        }

        onProgress?.({
          phase: 'downloading',
          current: i + 1,
          total: mediaItems.length,
          percentage: Math.round(((i + 1) / mediaItems.length) * 100),
          filename: generateMediaFilename(toFilenameCompatible(item), { index: i + 1 }),
        });

        try {
          const success = await this.downloadSingleWithIndex(item, i + 1);
          if (success) {
            successCount++;
          }
        } catch (error) {
          logger.error(`Failed to download item ${i + 1}:`, error);
        }

        // Rate limiting to prevent overwhelming the server
        if (i < mediaItems.length - 1) {
          await this.delay(BulkDownloadService.CONFIG.RATE_LIMIT_DELAY_MS);
        }
      }

      onProgress?.({
        phase: 'complete',
        current: mediaItems.length,
        total: mediaItems.length,
        percentage: 100,
      });

      logger.info(
        `Individual downloads completed: ${successCount}/${mediaItems.length} successful`
      );
      return {
        success: successCount > 0,
        filesProcessed: mediaItems.length,
        filesSuccessful: successCount,
      };
    } catch (error) {
      logger.error('Individual downloads failed:', error);
      return {
        success: false,
        filesProcessed: mediaItems.length,
        filesSuccessful: successCount,
        error: error instanceof Error ? error.message : 'Individual downloads failed',
      };
    }
  }

  /**
   * 최적 다운로드 전략 결정
   */
  private determineOptimalStrategy(
    mediaItems: readonly (MediaItem | MediaInfo)[]
  ): 'zip' | 'individual' {
    // Single file: always individual
    if (mediaItems.length === 1) {
      return 'individual';
    }

    // Multiple files: prefer ZIP for better UX
    return 'zip';
  }

  /**
   * 안전한 URL 추출
   */
  private extractSafeUrl(media: MediaItem | MediaInfo): string {
    if ('originalUrl' in media && media.originalUrl) {
      return media.originalUrl;
    }
    return media.url || '';
  }

  /**
   * 비동기 지연 유틸리티
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
