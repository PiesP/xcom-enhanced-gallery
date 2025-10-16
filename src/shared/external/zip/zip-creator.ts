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
