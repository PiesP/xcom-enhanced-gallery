/**
 * ZIP file creation utilities for X.com Enhanced Gallery
 *
 * Provides functionality to create ZIP files from media items
 * using fflate library for better performance and memory efficiency.
 *
 * @fileoverview ZIP creation utilities - Core 레이어 이동 완료
 * @version 1.0.0
 */

import { logger } from '../../logging';
import { getFflate } from '../../external/vendors';
import { safeParseInt } from '../../utils/type-safety-helpers';

/**
 * Media item interface for ZIP creation
 */
export interface MediaItemForZip {
  /** Primary URL for the media */
  url: string;
  /** Original/highest quality URL if available */
  originalUrl?: string;
  /** Filename for the media */
  filename?: string;
}

/**
 * Progress callback for ZIP creation
 */
export type ZipProgressCallback = (progress: number) => void;

/**
 * Configuration for ZIP creation
 */
export interface ZipCreationConfig {
  /** Compression level (0-9, 0 = no compression) */
  compressionLevel: number;
  /** Maximum file size per item in bytes */
  maxFileSize: number;
  /** Request timeout in milliseconds */
  requestTimeout: number;
  /** Maximum concurrent downloads */
  maxConcurrent: number;
}

// Constants for file size calculations
const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * BYTES_PER_KB;
const MAX_FILE_SIZE_MB = 100;
const REQUEST_TIMEOUT_MS = 30000;
const DEFAULT_CONCURRENT_DOWNLOADS = 4;
const NO_COMPRESSION_LEVEL = 0;

/**
 * Default ZIP creation configuration
 */
const DEFAULT_ZIP_CONFIG: ZipCreationConfig = {
  // No compression for already compressed media
  compressionLevel: NO_COMPRESSION_LEVEL,
  maxFileSize: MAX_FILE_SIZE_MB * BYTES_PER_MB, // 100MB
  requestTimeout: REQUEST_TIMEOUT_MS, // 30 seconds
  maxConcurrent: DEFAULT_CONCURRENT_DOWNLOADS,
};

/**
 * Creates a ZIP file from media items
 */
export async function createZipFromItems(
  items: MediaItemForZip[],
  zipFileName: string,
  onProgress?: ZipProgressCallback,
  config: Partial<ZipCreationConfig> = {}
): Promise<Blob> {
  const fullConfig = { ...DEFAULT_ZIP_CONFIG, ...config };

  try {
    logger.time('[ZipCreator] createZipFromItems');
    logger.info(`[ZipCreator] Creating ZIP with ${items.length} items`);

    // Download all files and prepare for ZIP
    const fileData = await downloadFilesForZip(items, onProgress, fullConfig);

    // Create ZIP using fflate
    const zipBlob = await createZipBlob(fileData, zipFileName, fullConfig);

    logger.info(`[ZipCreator] ZIP created successfully: ${zipBlob.size} bytes`);
    return zipBlob;
  } catch (error) {
    logger.error(
      '[ZipCreator] ZIP creation failed:',
      error instanceof Error ? error.message : String(error)
    );
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create ZIP: ${errorMessage}`);
  } finally {
    logger.timeEnd('[ZipCreator] createZipFromItems');
  }
}

/**
 * Creates a ZIP Uint8Array from in-memory files map
 * - Adapter function to consolidate zip path usage from services
 */
export async function createZipBytesFromFileMap(
  files: Record<string, Uint8Array>,
  config: Partial<ZipCreationConfig> = {}
): Promise<Uint8Array> {
  const fullConfig = { ...DEFAULT_ZIP_CONFIG, ...config };
  const fflate = await getFflate();
  if (!fflate) throw new Error('fflate library not available');

  // Prefer async API if available
  if (typeof (fflate as any).zip === 'function') {
    return new Promise<Uint8Array>((resolve, reject) => {
      try {
        (fflate as any).zip(
          files,
          { level: fullConfig.compressionLevel ?? NO_COMPRESSION_LEVEL },
          (err: any, data: Uint8Array) => {
            if (err) {
              logger.error('[ZipCreator] fflate.zip failed:', err.message ?? String(err));
              reject(new Error(`ZIP creation failed: ${err.message ?? String(err)}`));
              return;
            }
            if (!data || data.byteLength === 0) {
              reject(new Error('No valid data returned from fflate.zip'));
              return;
            }
            resolve(new Uint8Array(data));
          }
        );
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    });
  }

  // Fallback: legacy sync API (used by tests to capture input)
  if (typeof (fflate as any).zipSync === 'function') {
    try {
      const bytes: Uint8Array = (fflate as any).zipSync(files, {
        level: fullConfig.compressionLevel ?? NO_COMPRESSION_LEVEL,
      });
      if (!bytes || bytes.byteLength === 0) {
        throw new Error('No valid data returned from fflate.zipSync');
      }
      return new Uint8Array(bytes);
    } catch (e) {
      throw e instanceof Error ? e : new Error(String(e));
    }
  }

  throw new Error('No supported fflate zip API available');
}

/**
 * Downloads files and prepares them for ZIP creation
 */
async function downloadFilesForZip(
  items: MediaItemForZip[],
  onProgress?: ZipProgressCallback,
  config: ZipCreationConfig = DEFAULT_ZIP_CONFIG
): Promise<Map<string, Uint8Array>> {
  const fileData = new Map<string, Uint8Array>();
  const total = items.length;
  let completed = 0;

  // Process items in chunks to avoid overwhelming the browser
  const chunks = chunkArray(items, config.maxConcurrent);

  for (const chunk of chunks) {
    const promises = chunk.map(async (item: MediaItemForZip) => {
      try {
        const data = await downloadMediaForZip(item, config);
        const filename = generateUniqueFilename(item.filename ?? 'media.jpg', fileData);
        fileData.set(filename, data);

        completed++;
        if (onProgress) {
          onProgress(completed / total);
        }

        logger.debug(`[ZipCreator] Downloaded for ZIP: ${filename}`);
      } catch (error) {
        logger.warn(
          `[ZipCreator] Failed to download ${item.filename}:`,
          error instanceof Error ? error.message : String(error)
        );
        // Continue with other files even if one fails
      }
    });

    await Promise.all(promises);
  }

  return fileData;
}

/**
 * Downloads a single media item for ZIP inclusion
 */
async function downloadMediaForZip(
  item: MediaItemForZip,
  config: ZipCreationConfig
): Promise<Uint8Array> {
  const url = item.originalUrl ?? item.url;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; XEG/1.0)',
    },
    signal: AbortSignal.timeout(config.requestTimeout),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const contentLength = response.headers.get('content-length');
  const contentLengthValue = contentLength?.trim();
  // 명시적으로 null/undefined/empty 케이스 처리
  if (
    contentLengthValue !== null &&
    contentLengthValue !== undefined &&
    contentLengthValue !== ''
  ) {
    const fileSizeBytes = safeParseInt(contentLengthValue, 10);
    if (!isNaN(fileSizeBytes) && fileSizeBytes > config.maxFileSize) {
      throw new Error(`File too large: ${fileSizeBytes} bytes`);
    }
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Creates ZIP blob using fflate
 */
async function createZipBlob(
  fileData: Map<string, Uint8Array>,
  _zipFileName: string,
  config: ZipCreationConfig
): Promise<Blob> {
  const fflate = await getFflate();

  if (!fflate) {
    throw new Error('fflate library not available');
  }

  return new Promise((resolve, reject) => {
    try {
      // Convert Map to fflate format with compression settings
      const files: Record<string, [Uint8Array, { level?: number }]> = {};
      for (const [filename, data] of fileData) {
        files[filename] = [data, { level: config.compressionLevel }];
      }

      // Create ZIP using fflate with proper type handling
      const zipFiles: Record<string, Uint8Array> = {};
      for (const [filename, [data]] of Object.entries(files)) {
        zipFiles[filename] = data;
      }

      fflate.zip(zipFiles, { level: 6 }, (error: Error | null, data: Uint8Array) => {
        if (error) {
          logger.error('[ZipCreator] fflate.zip failed:', error.message);
          reject(new Error(`ZIP creation failed: ${error.message}`));
          return;
        }

        // fflate 콜백에서 반환된 데이터의 유효성을 확인
        // TypeScript 타입 정의와 달리 런타임에서는 빈 데이터가 올 수 있음
        if (!data || data.byteLength === 0) {
          reject(new Error('No valid data returned from fflate.zip'));
          return;
        }

        try {
          // ArrayBufferLike 호환성 문제 해결을 위해 새로운 Uint8Array로 복사
          const safeData = new Uint8Array(data);
          const blob = new Blob([safeData], { type: 'application/zip' });
          logger.info(`[ZipCreator] fflate ZIP created: ${blob.size} bytes`);
          resolve(blob);
        } catch (blobError) {
          logger.error(
            '[ZipCreator] Failed to create blob:',
            blobError instanceof Error ? blobError.message : String(blobError)
          );
          reject(
            new Error(
              `Failed to create ZIP blob: ${blobError instanceof Error ? blobError.message : String(blobError)}`
            )
          );
        }
      });
    } catch (zipError) {
      logger.error(
        '[ZipCreator] ZIP creation error:',
        zipError instanceof Error ? zipError.message : String(zipError)
      );
      reject(
        new Error(
          `ZIP creation failed: ${zipError instanceof Error ? zipError.message : String(zipError)}`
        )
      );
    }
  });
}

/**
 * Splits an array into chunks of specified size
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Generates a unique filename to avoid conflicts in the ZIP
 */
function generateUniqueFilename(
  originalFilename: string,
  existingFiles: Map<string, Uint8Array>
): string {
  if (!existingFiles.has(originalFilename)) {
    return originalFilename;
  }

  const lastDotIndex = originalFilename.lastIndexOf('.');
  const baseName =
    lastDotIndex > 0 ? originalFilename.substring(0, lastDotIndex) : originalFilename;
  const extension = lastDotIndex > 0 ? originalFilename.substring(lastDotIndex) : '';

  let counter = 1;
  let newFilename: string;
  do {
    newFilename = `${baseName}_${counter}${extension}`;
    counter++;
  } while (existingFiles.has(newFilename));

  return newFilename;
}
