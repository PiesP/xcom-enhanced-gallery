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
import { StoreZipWriter } from './store-zip-writer';
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
 *
 * @deprecated This high-level helper is superseded by createZipBytesFromFileMap and
 * DownloadOrchestrator-based flows. Do not use in production services; keep only
 * for legacy/tests until fully removed in a future cleanup cycle.
 */
export async function createZipFromItems(
  items: MediaItemForZip[],
  _zipFileName: string,
  _progressCallback?: (downloaded: number, total: number) => void
): Promise<Blob> {
  try {
    logger.time('[ZipCreator] createZipFromItems');
    logger.info(`[ZipCreator] Creating ZIP with ${items.length} items`);

    // Download all files and prepare for ZIP
    const fileData = await downloadFilesForZip(items, undefined, DEFAULT_ZIP_CONFIG);

    // Create ZIP using StoreZipWriter
    const writer = new StoreZipWriter();
    for (const [filename, data] of fileData.entries()) {
      writer.addFile(filename, data);
    }
    const zipBytes = writer.build();
    // Convert Uint8Array to proper ArrayBuffer for Blob
    const arrayBuffer = zipBytes.buffer.slice(
      zipBytes.byteOffset,
      zipBytes.byteOffset + zipBytes.byteLength
    ) as ArrayBuffer;
    const zipBlob = new Blob([arrayBuffer], { type: 'application/zip' });

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
 * - Uses StoreZipWriter for lightweight, dependency-free ZIP creation
 * - No compression (STORE method) suitable for already compressed media files
 */
export async function createZipBytesFromFileMap(
  files: Record<string, Uint8Array>,
  _config: Partial<ZipCreationConfig> = {}
): Promise<Uint8Array> {
  try {
    logger.time('[ZipCreator] createZipBytesFromFileMap');

    const writer = new StoreZipWriter();

    // Add all files to the ZIP
    for (const [filename, data] of Object.entries(files)) {
      writer.addFile(filename, data);
    }

    // Build the ZIP
    const zipBytes = writer.build();

    logger.info(
      `[ZipCreator] ZIP created: ${zipBytes.byteLength} bytes, ${Object.keys(files).length} files`
    );
    logger.timeEnd('[ZipCreator] createZipBytesFromFileMap');

    return zipBytes;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('[ZipCreator] createZipBytesFromFileMap failed:', msg);
    throw new Error(`ZIP creation failed: ${msg}`);
  }
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
