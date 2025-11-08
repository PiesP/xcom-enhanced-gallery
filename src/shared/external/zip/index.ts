/**
 * ZIP Utility Layer - File compression & archival
 *
 * **Purpose**: Create ZIP files from in-memory file maps or media items
 * **Compression**: STORE mode (for already compressed media, no additional compression)
 * **Pattern**: Barrel exports only, forbid direct imports of internal files
 * **Integration**: BulkDownloadService batch download orchestration
 *
 * **Internal Implementation (not exposed)**:
 * - `zip-creator.ts`: Core ZIP creation logic (public API)
 * - `store-zip-writer.ts`: STORE mode ZIP writer (internal)
 * - `streaming-zip-writer.ts`: Streaming processing (optional, Phase 410)
 *
 * **Usage Pattern**:
 * ```typescript
 * // ✅ Correct: Use barrel export
 * import { createZipBytesFromFileMap } from '@shared/external/zip';
 * const zipBytes = await createZipBytesFromFileMap(
 *   { 'photo1.jpg': buffer1, 'photo2.jpg': buffer2 },
 *   { compressionLevel: 0 }
 * );
 *
 * // ❌ Forbidden: Direct import of internal files
 * import { StoreZipWriter } from '@shared/external/zip/store-zip-writer';
 * import { createZipImpl } from '@shared/external/zip/zip-creator';
 * ```
 *
 * **Constraints**:
 * - Max 50MB per file
 * - Max 5 concurrent downloads (Phase 312 default)
 * - STORE mode: Pre-compressed media not re-compressed (performance optimization)
 * - Memory-based: Suitable for bulk downloads with streaming support (Phase 410)
 *
 * **Integration Points**:
 * - `BulkDownloadService`: ZIP creation for batch downloads
 * - `DownloadService`: Single file downloads (no ZIP)
 * - `download-orchestrator.ts`: Progress tracking & retry logic
 *
 * **Related Documentation**:
 * - {@link ../README.md} - External utilities overview
 * - {@link ../../services/bulk-download-service.ts} - Batch orchestration
 * - {@link ../../services/download-orchestrator.ts} - Progress tracking
 *
 * @fileoverview ZIP utility layer - barrel export compliance (Phase 374)
 * @version 11.0.0 - Phase 374: Optimization + comprehensive JSDoc
 * @internal Implementation details exposed in individual files, not here
 */

/**
 * **ZIP Creation**: Create ZIP file bytes from file map
 *
 * **STORE Mode**: Already compressed media is not re-compressed (performance optimization)
 *
 * @example
 * ```typescript
 * import { createZipBytesFromFileMap } from '@shared/external/zip';
 *
 * // Prepare file map
 * const files: Record<string, Uint8Array> = {
 *   'photo1.jpg': jpgBuffer1,
 *   'photo2.jpg': jpgBuffer2,
 *   'video.mp4': mp4Buffer,
 * };
 *
 * // Create ZIP
 * const zipBytes = await createZipBytesFromFileMap(files, {
 *   compressionLevel: 0, // STORE mode (no compression)
 * });
 *
 * // Download
 * const blob = new Blob([zipBytes], { type: 'application/zip' });
 * await downloadService.downloadBlob({ blob, name: 'media.zip' });
 * ```
 *
 * @param fileMap File name → bytes map
 * @param options Options (compressionLevel, etc)
 * @returns ZIP file bytes (Uint8Array)
 *
 * @see MediaItemForZip - Input type definition
 */
export { createZipBytesFromFileMap, type MediaItemForZip } from './zip-creator';
