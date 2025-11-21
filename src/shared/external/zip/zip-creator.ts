/**
 * @fileoverview ZIP file creation utility for X.com Enhanced Gallery
 * @description Generate ZIP file (Uint8Array) from media items array
 * @version 11.0.0 - Phase 374: Optimization, comprehensive JSDoc
 *
 * **Implementation**:
 * - Based on StoreZipWriter (lightweight, zero external dependencies)
 * - STORE compression method (no compression for pre-compressed media: JPEG, PNG)
 * - Suitable for bulk media downloads with streaming support
 *
 * @internal Phase 374 ZIP optimization, used by BulkDownloadService
 */

import { logger } from '../../logging';
import { StoreZipWriter } from './store-zip-writer';

/**
 * Media item for ZIP creation
 *
 * **Fields**:
 * - `url`: Primary download URL (used if no originalUrl)
 * - `originalUrl`: High-resolution URL fallback
 * - `filename`: Output filename in ZIP
 *
 * **Usage**: Passed to BulkDownloadService for batch processing
 *
 * @internal Phase 374, used by download orchestration
 */
export interface MediaItemForZip {
  /** Primary URL (download target) */
  url: string;
  /** High-resolution URL (fallback) */
  originalUrl?: string;
  /** Output filename in ZIP */
  filename?: string;
}

/**
 * ZIP creation progress callback
 *
 * Invoked during ZIP generation to report progress percentage (0-100).
 *
 * @param progress - Current progress (0-100%)
 *
 * @internal Used by download orchestrator for UI updates
 */
export type ZipProgressCallback = (progress: number) => void;

/**
 * ZIP creation configuration options
 *
 * **Typical Usage**:
 * ```typescript
 * const config: ZipCreationConfig = {
 *   compressionLevel: 0,      // STORE method (no compression)
 *   maxFileSize: 5e8,         // 500 MB per file
 *   requestTimeout: 30000,    // 30s per download
 *   maxConcurrent: 3,         // 3 parallel downloads
 * };
 * ```
 *
 * @internal Phase 374, used for download orchestration tuning
 */
export interface ZipCreationConfig {
  /** Compression level (0-9, 0=STORE method for pre-compressed media) */
  compressionLevel: number;
  /** Maximum file size per item (bytes) */
  maxFileSize: number;
  /** Request timeout (ms) */
  requestTimeout: number;
  /** Maximum concurrent downloads */
  maxConcurrent: number;
}

/**
 * Create ZIP Uint8Array from file map
 *
 * **Algorithm**:
 * 1. Initialize StoreZipWriter (STORE method, no compression)
 * 2. Add all files to writer
 * 3. Build complete ZIP with headers and central directory
 * 4. Return as binary Uint8Array
 *
 * **Performance**: O(n) where n = total file size
 *
 * @param files - Record mapping filename → file bytes
 * @param _config - ZIP creation config (currently unused, reserved for future)
 * @returns Promise resolving to ZIP bytes (Uint8Array)
 * @throws Error if ZIP creation fails (I/O, header corruption, etc.)
 *
 * **Logging**:
 * - Timing via logger.time/timeEnd
 * - Success: file count, total size
 * - Error: detailed error message
 *
 * **Example**:
 * ```typescript
 * const files = {
 *   'photo1.jpg': jpegBytes1,
 *   'photo2.jpg': jpegBytes2,
 * };
 * const zipBytes = await createZipBytesFromFileMap(files);
 * ```
 *
 * @internal Phase 374 ZIP optimization, used by download orchestrator
 */
export async function createZipBytesFromFileMap(
  files: Record<string, Uint8Array>,
  _config: Partial<ZipCreationConfig> = {}
): Promise<Uint8Array> {
  try {
    logger.time('[ZipCreator] createZipBytesFromFileMap');

    const writer = new StoreZipWriter();

    // Add all files
    for (const [filename, data] of Object.entries(files)) {
      writer.addFile(filename, data);
    }

    // Build ZIP with headers
    const zipBytes = writer.build();

    logger.info(
      `[ZipCreator] ZIP creation complete: ${zipBytes.byteLength} bytes, ${Object.keys(files).length} files`
    );
    logger.timeEnd('[ZipCreator] createZipBytesFromFileMap');

    return zipBytes;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('[ZipCreator] ZIP creation failed:', msg);
    throw new Error(`ZIP creation failed: ${msg}`);
  }
}
