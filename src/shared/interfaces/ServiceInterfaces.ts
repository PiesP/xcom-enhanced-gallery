/**
 * @fileoverview Core Service Interfaces
 * @version 1.0.0 - Clean Architecture Interfaces
 *
 * Clean Architecture 원칙에 따른 서비스 인터페이스들
 * core 레이어에서 features/shared 레이어의 구현체에 의존하지 않도록 추상화
 */

import type { MediaInfo } from '@shared/types/media.types';

/**
 * 갤러리 다운로드 서비스 인터페이스
 */
export interface DownloadManager {
  downloadSingle(item: MediaInfo): Promise<void>;
  downloadMultiple(items: MediaInfo[]): Promise<void>;
}

/**
 * 미디어 추출 서비스 인터페이스
 */
export interface MediaExtractionService {
  extractMediaFromTweet(element: HTMLElement): Promise<MediaInfo[]>;
  extractSingleMedia(element: HTMLElement): Promise<MediaInfo | null>;
}

/**
 * 미디어 파일명 서비스 인터페이스
 */
export interface MediaFilenameService {
  generateFilename(media: MediaInfo, options?: Record<string, unknown>): string;
  generateZipFilename(options?: Record<string, unknown>): string;
  generateUniqueFilename(
    media: MediaInfo,
    options?: Record<string, unknown>,
    existingFiles?: string[]
  ): string;
  isValidFilename(filename: string): boolean;
}

// 하위 호환성을 위한 별칭
export type IDownloadManager = DownloadManager;
export type IMediaExtractionService = MediaExtractionService;
export type IMediaFilenameService = MediaFilenameService;
