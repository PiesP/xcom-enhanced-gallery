/**
 * Download Service
 *
 * 갤러리의 다운로드 기능을 담당하는 통합 서비스입니다.
 * Core layer의 DownloadService를 사용하여 Clean Architecture 원칙을 준수합니다.
 *
 * Feature Layer Pattern:
 * - Core 서비스 위임
 * - 갤러리 특화 로직
 * - UI 통합 인터페이스
 */

import {
  BulkDownloadService,
  type DownloadOptions,
  type DownloadProgress,
  type DownloadResult,
} from '@core/services/BulkDownloadService';
import type { MediaInfo, MediaItem } from '@core/types/media.types';
import { logger } from '@core/logging/logger';

// Re-export types for convenience
export type { DownloadOptions, DownloadProgress, DownloadResult };

/**
 * 갤러리 다운로드 서비스
 *
 * Clean Architecture 패턴을 따라 Core layer의 DownloadService를 사용합니다.
 * 갤러리 특화 기능과 UI 통합을 담당합니다.
 */
export class DownloadService {
  private static instance: DownloadService;
  private readonly coreDownloadService = BulkDownloadService.getInstance();
  private _isInitialized = false;

  public static getInstance(): DownloadService {
    DownloadService.instance ??= new DownloadService();
    return DownloadService.instance;
  }

  private constructor() {}

  /**
   * 서비스 초기화 (테스트 호환성을 위해)
   */
  async initialize(): Promise<void> {
    if (this._isInitialized) {
      return;
    }

    logger.info('DownloadService: initializing...');
    await this.coreDownloadService.initialize();
    this._isInitialized = true;
    logger.info('DownloadService: initialized');
  }

  /**
   * 서비스 정리 (테스트 호환성을 위해)
   */
  async destroy(): Promise<void> {
    if (!this._isInitialized) {
      return;
    }

    logger.info('DownloadService: destroying...');
    this.coreDownloadService.destroy();
    this._isInitialized = false;
    logger.info('DownloadService: destroyed');
  }

  /**
   * 초기화 상태 확인
   */
  isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * 테스트 호환성을 위한 별칭 메소드
   */
  async downloadBulk(
    mediaItems: readonly (MediaItem | MediaInfo)[],
    options: DownloadOptions = {}
  ): Promise<DownloadResult & { downloadedCount?: number }> {
    const result = await this.downloadMultiple(mediaItems, options);
    return {
      ...result,
      downloadedCount: result.filesSuccessful,
    };
  }

  /**
   * 현재 미디어 다운로드 (갤러리 특화 진입점)
   */
  async downloadCurrent(media: MediaItem | MediaInfo): Promise<boolean> {
    logger.info('Gallery: downloading current media');
    const result = await this.coreDownloadService.downloadSingle(media);
    return result.success;
  }

  /**
   * 여러 미디어 다운로드 (갤러리 특화 진입점)
   */
  async downloadMultiple(
    mediaItems: readonly (MediaItem | MediaInfo)[],
    options: DownloadOptions = {}
  ): Promise<DownloadResult> {
    logger.info(`Gallery: downloading ${mediaItems.length} media items`);
    return this.coreDownloadService.downloadMultiple(mediaItems, options);
  }

  /**
   * 갤러리 전체 다운로드 (갤러리 특화 메서드)
   */
  async downloadAll(
    mediaItems: readonly (MediaItem | MediaInfo)[],
    options: Omit<DownloadOptions, 'strategy'> = {}
  ): Promise<DownloadResult> {
    logger.info(`Gallery: downloading all ${mediaItems.length} items as ZIP`);

    return this.coreDownloadService.downloadMultiple(mediaItems, {
      ...options,
      strategy: 'zip', // 갤러리 전체 다운로드는 항상 ZIP
    });
  }

  /**
   * 선택된 미디어 개별 다운로드 (갤러리 특화 메서드)
   */
  async downloadSelected(
    mediaItems: readonly (MediaItem | MediaInfo)[],
    options: Omit<DownloadOptions, 'strategy'> = {}
  ): Promise<DownloadResult> {
    logger.info(`Gallery: downloading ${mediaItems.length} selected items individually`);

    return this.coreDownloadService.downloadMultiple(mediaItems, {
      ...options,
      strategy: 'individual', // 선택된 항목은 개별 다운로드
    });
  }

  /**
   * 단일 미디어 다운로드 (테스트 호환성 메서드)
   */
  async downloadSingle(media: MediaItem | MediaInfo): Promise<DownloadResult> {
    logger.info('Gallery: downloading single media item');
    const singleResult = await this.coreDownloadService.downloadSingle(media);

    // SingleDownloadResult를 DownloadResult로 변환
    const result: DownloadResult = {
      success: singleResult.success,
      filesProcessed: 1,
      filesSuccessful: singleResult.success ? 1 : 0,
    };

    if (singleResult.error) {
      result.error = singleResult.error;
    }

    return result;
  }
}
