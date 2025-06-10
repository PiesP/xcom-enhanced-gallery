/**
 * @fileoverview Bulk Download Service - Core Business Logic
 * @version 2.0.0
 * @follows Clean Architecture Pattern
 *
 * Core layer에 위치한 대량 다운로드 서비스입니다.
 * 여러 미디어 파일의 일괄 다운로드 비즈니스 로직을 중앙 집중화하여 일관성을 보장합니다.
 */

import type { MediaInfo, MediaItem } from '@core/types/media.types';
import { logger } from '@infrastructure/logging/logger';
import { generateMediaFilename, generateZipFilename } from '@shared/utils/media';
import { getNativeDownload } from '@shared/utils/external';
import { createZipFromItems, type MediaItemForZip } from '@shared/utils/external';

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
}

export interface DownloadResult {
  success: boolean;
  filesProcessed: number;
  filesSuccessful: number;
  error?: string;
}

/**
 * 대량 다운로드 서비스 - Core Business Logic
 *
 * Clean Architecture 원칙을 따라 core layer에서 비즈니스 로직을 관리합니다.
 * Singleton 패턴으로 전역 상태 관리 및 일관된 대량 다운로드 처리를 보장합니다.
 */
export class BulkDownloadService {
  private static instance: BulkDownloadService;

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
   * 단일 미디어 다운로드
   * @param media - 다운로드할 미디어 아이템
   * @returns 다운로드 성공 여부
   */
  async downloadSingle(media: MediaItem | MediaInfo): Promise<boolean> {
    return this.downloadSingleWithIndex(media);
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
      const filename = generateMediaFilename(media, index ? { index } : undefined);

      logger.info('Starting single media download:', filename);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      downloader.downloadBlob(blob, filename);

      logger.info('Single media download completed:', filename);
      return true;
    } catch (error) {
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
    const { onProgress, signal: _signal, zipFilename } = options;

    try {
      logger.info(`Starting ZIP download for ${mediaItems.length} items`);

      // Progress callback for ZIP creation
      const progressCallback = (progress: number) => {
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
        filename: generateMediaFilename(item, { index: index + 1 }),
      }));

      const finalZipFilename = zipFilename ?? generateZipFilename(mediaItems);

      onProgress?.({
        phase: 'preparing',
        current: 0,
        total: mediaItems.length,
        percentage: 0,
      });

      // Create ZIP with core configuration
      const zipBlob = await createZipFromItems(zipItems, finalZipFilename, progressCallback, {
        compressionLevel: BulkDownloadService.CONFIG.ZIP_COMPRESSION_LEVEL,
        maxFileSize: BulkDownloadService.CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024,
        requestTimeout: BulkDownloadService.CONFIG.REQUEST_TIMEOUT_MS,
        maxConcurrent: BulkDownloadService.CONFIG.DEFAULT_CONCURRENT_DOWNLOADS,
      });

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
          filename: generateMediaFilename(item, { index: i + 1 }),
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
