/**
 * @fileoverview Download Manager - 통합 다운로드 관리 서비스
 * @description Phase 2: 모든 다운로드 관련 기능을 통합한 핵심 서비스
 * @version 2.0.0 - Layer Simplification
 */

import { logger } from '@shared/logging/logger';
import type { BaseService } from '@shared/types/app.types';
import type { MediaInfo, MediaItem, MediaItemForFilename } from '@shared/types/media.types';

// 다운로드 관련 기존 서비스들
import { BulkDownloadService } from '../services/BulkDownloadService';
import type {
  BulkDownloadOptions,
  DownloadProgress,
  DownloadResult,
  DownloadInfo,
} from '../services/BulkDownloadService';

// 파일명 서비스
import { FilenameService } from '../media/FilenameService';

// 외부 라이브러리
import { getNativeDownload } from '@shared/external/vendors';

/**
 * 단일 다운로드 옵션
 */
export interface SingleDownloadOptions {
  /** 사용자 정의 파일명 */
  filename?: string;
  /** 파일명 중복 처리 */
  handleDuplicates?: boolean;
  /** 메타데이터 포함 여부 */
  includeMetadata?: boolean;
}

/**
 * 통합 다운로드 관리 서비스
 *
 * 모든 다운로드 관련 기능을 하나로 통합:
 * - BulkDownloadService (대량 다운로드)
 * - FilenameService (파일명 생성)
 * - 단일 파일 다운로드
 * - 진행상황 관리
 */
export class DownloadManager implements BaseService {
  private static instance: DownloadManager | null = null;
  private _isInitialized = false;

  // 통합된 서비스 컴포넌트들
  private readonly bulkDownloadService: BulkDownloadService;
  private readonly filenameService: FilenameService;

  private constructor() {
    this.bulkDownloadService = BulkDownloadService.getInstance();
    this.filenameService = FilenameService.getInstance();
  }

  public static getInstance(): DownloadManager {
    DownloadManager.instance ??= new DownloadManager();
    return DownloadManager.instance;
  }

  public async initialize(): Promise<void> {
    if (this._isInitialized) return;

    logger.info('DownloadManager initializing...');

    // 서비스들 초기화 (FilenameService는 initialize 메서드 없음)
    await this.bulkDownloadService.initialize();

    this._isInitialized = true;
    logger.info('DownloadManager initialized');
  }

  public destroy(): void {
    if (!this._isInitialized) return;

    logger.info('DownloadManager destroying...');
    this.bulkDownloadService.destroy();
    // FilenameService는 destroy 메서드 없음
    this._isInitialized = false;
    logger.info('DownloadManager destroyed');
  }

  public isInitialized(): boolean {
    return this._isInitialized;
  }

  // ====================================
  // Single Download API
  // ====================================

  /**
   * 단일 미디어 파일 다운로드
   */
  public async downloadSingle(
    mediaItem: MediaInfo,
    options: SingleDownloadOptions = {}
  ): Promise<boolean> {
    try {
      logger.info('Starting single download:', mediaItem.url);

      // 파일명 생성
      const filename = options.filename || this.generateFilename(mediaItem);

      // Native download API 사용 (URL을 Blob으로 변환 필요)
      const downloadAPI = getNativeDownload();

      // URL에서 데이터를 가져와서 Blob 생성
      const response = await fetch(mediaItem.url);
      const blob = await response.blob();

      downloadAPI.downloadBlob(blob, filename);

      logger.info('Single download completed:', filename);
      return true;
    } catch (error) {
      logger.error('Single download failed:', error);
      return false;
    }
  }

  // ====================================
  // Bulk Download API
  // ====================================

  /**
   * 대량 다운로드 실행
   */
  public async downloadAll(
    items: readonly MediaItem[],
    options: BulkDownloadOptions = {}
  ): Promise<DownloadResult> {
    return this.bulkDownloadService.downloadMultiple(items, options);
  }

  /**
   * 대량 다운로드 중단
   */
  public async abortDownload(): Promise<void> {
    return this.bulkDownloadService.cancelDownload();
  }

  /**
   * 현재 다운로드 정보 조회
   */
  public getDownloadInfo(): DownloadInfo {
    return this.bulkDownloadService.getCurrentDownloadInfo();
  }

  /**
   * 다운로드 진행중인지 확인
   */
  public isDownloading(): boolean {
    return this.bulkDownloadService.getCurrentDownloadInfo().isDownloading;
  }

  // ====================================
  // Filename Generation API
  // ====================================

  /**
   * 미디어 파일명 생성
   */
  public generateFilename(mediaItem: MediaItemForFilename): string {
    return this.filenameService.generateMediaFilename(mediaItem);
  }

  /**
   * ZIP 파일명 생성
   */
  public generateZipFilename(username?: string): string {
    const mediaItems = username ? [{ tweetUsername: username }] : [];
    return this.filenameService.generateZipFilename(mediaItems as MediaItemForFilename[]);
  }

  /**
   * 안전한 파일명 생성 (특수문자 처리)
   */
  public sanitizeFilename(filename: string): string {
    // FilenameService에 해당 메서드가 없으므로 직접 구현
    return filename.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
  }

  /**
   * 파일 확장자 추출
   */
  public extractExtension(url: string): string {
    // FilenameService의 내부 메서드 사용 대신 직접 구현
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const lastDot = pathname.lastIndexOf('.');
      if (lastDot > 0) {
        return pathname.substring(lastDot + 1).toLowerCase();
      }
      return 'jpg'; // 기본값
    } catch {
      return 'jpg';
    }
  }

  // ====================================
  // Utility Methods
  // ====================================

  /**
   * 다운로드 가능한 아이템들만 필터링
   */
  public filterDownloadableItems(items: readonly MediaItem[]): MediaItem[] {
    return items.filter(
      item =>
        item.url && (item.type === 'image' || item.type === 'video') && this.isValidUrl(item.url)
    );
  }

  /**
   * URL 유효성 검사
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 다운로드 전략 결정
   */
  public determineDownloadStrategy(itemCount: number): 'individual' | 'zip' {
    // 5개 이상이면 ZIP으로 압축
    return itemCount >= 5 ? 'zip' : 'individual';
  }

  /**
   * 다운로드 크기 추정
   */
  public estimateDownloadSize(items: readonly MediaItem[]): Promise<number> {
    // BulkDownloadService에 해당 메서드가 없으므로 기본 추정치 반환
    return Promise.resolve(items.length * 1024 * 1024); // 1MB per item as estimate
  }

  /**
   * 다운로드 통계 조회
   */
  public getDownloadStats() {
    // BulkDownloadService에 해당 메서드가 없으므로 기본 통계 반환
    const info = this.bulkDownloadService.getCurrentDownloadInfo();
    return {
      totalDownloads: 0, // DownloadInfo에 해당 필드 없음
      successfulDownloads: 0, // DownloadInfo에 해당 필드 없음
      failedDownloads: info.failedFiles.length,
      isDownloading: info.isDownloading,
      progress: info.progress,
    };
  }
}

/**
 * 전역 DownloadManager 인스턴스
 */
export const downloadManager = DownloadManager.getInstance();

// 편의 함수들 (호환성)
export type { BulkDownloadOptions, DownloadProgress, DownloadResult, DownloadInfo };
