/**
 * ZIP 다운로드 기능 지연 로딩 모듈
 *
 * ZIP 관련 기능을 별도 모듈로 분리하여 필요할 때만 로드
 */

import type { MediaItem, MediaInfo } from '@shared/types/media.types';
import type { MediaItemForZip } from '@shared/external/zip';
import { logger } from '@shared/logging/logger';
import { getNativeDownload } from '@shared/external/vendors';
import { generateMediaFilename, generateZipFilename } from '@shared/media';

// 순환 의존성 방지를 위해 독립적인 타입 정의
export interface LazyDownloadProgress {
  phase: 'preparing' | 'downloading' | 'zipping' | 'complete';
  current: number;
  total: number;
  percentage: number;
  filename?: string;
}

export interface LazyBulkDownloadOptions {
  onProgress?: (progress: LazyDownloadProgress) => void;
  signal?: AbortSignal;
  zipFilename?: string;
  strategy?: 'auto' | 'zip' | 'individual';
  includeImages?: boolean;
  includeVideos?: boolean;
  maxFiles?: number;
  compressionLevel?: number;
  includeMetadata?: boolean;
}

export interface LazyDownloadResult {
  success: boolean;
  filesProcessed: number;
  filesSuccessful: number;
  error?: string;
  filename?: string;
}

/**
 * MediaInfo를 FilenameService가 기대하는 타입으로 변환
 */
function toFilenameCompatible(media: MediaInfo | MediaItem): MediaInfo | MediaItem {
  return {
    ...media,
    id: media.id || `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
}

/**
 * 안전한 URL 추출
 */
function extractSafeUrl(item: MediaItem | MediaInfo): string {
  if (typeof item.url === 'string' && item.url.length > 0) {
    return item.url;
  }
  throw new Error(`Invalid URL for item ${item.id}`);
}

/**
 * ZIP 다운로드 서비스 (지연 로딩)
 */
export async function downloadAsZip(
  mediaItems: readonly (MediaItem | MediaInfo)[],
  options: LazyBulkDownloadOptions = {}
): Promise<LazyDownloadResult> {
  const { onProgress, zipFilename } = options;

  try {
    logger.info(`Starting ZIP download for ${mediaItems.length} items`);

    // 지연 로딩: ZIP 기능이 필요할 때만 fflate와 zip-creator 로드
    logger.debug('Loading ZIP creation module...');
    const { createZipFromItems } = await import('@shared/external/zip');
    logger.debug('ZIP creation module loaded successfully');

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
      url: extractSafeUrl(item),
      originalUrl: extractSafeUrl(item),
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

    // ZIP 설정
    const ZIP_COMPRESSION_LEVEL = 6;
    const MAX_FILE_SIZE_MB = 100;
    const REQUEST_TIMEOUT_MS = 30000;
    const DEFAULT_CONCURRENT_DOWNLOADS = 3;

    // Create ZIP with core configuration
    const zipBlob = (await createZipFromItems(zipItems, finalZipFilename, progressCallback, {
      compressionLevel: ZIP_COMPRESSION_LEVEL,
      maxFileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
      requestTimeout: REQUEST_TIMEOUT_MS,
      maxConcurrent: DEFAULT_CONCURRENT_DOWNLOADS,
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
 * ZIP 다운로드 가능 여부 확인
 */
export function isZipDownloadAvailable(): boolean {
  try {
    // 기본적인 브라우저 API 확인
    return (
      typeof window !== 'undefined' && typeof Blob !== 'undefined' && typeof URL !== 'undefined'
    );
  } catch {
    return false;
  }
}
