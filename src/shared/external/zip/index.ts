/**
 * ZIP Utility Layer - File compression & archival
 *
 * **Purpose**: Create ZIP files from in-memory file maps or media items
 * **Compression**: STORE mode (for already compressed media, no additional compression)
 * **Pattern**: Barrel exports only, forbid direct imports of internal files
 * **Integration**: BulkDownloadService batch download orchestration
 *
 * **Internal Implementation (not exposed)**:
 * - `streaming-zip-writer.ts`: Streaming processing (Phase 410)
 *
 * **Usage Pattern**:
 * ```typescript
 * // ✅ Correct: Use barrel export
 * import { StreamingZipWriter } from '@shared/external/zip';
 * const writer = new StreamingZipWriter();
 * writer.addFile('photo1.jpg', buffer1);
 * const zipBytes: Uint8Array = writer.finalize();
 * ```
 *
 * **Constraints**:
 * - Concurrency is controlled by the download layer (default: 6, max: 8)
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

export { StreamingZipWriter } from './streaming-zip-writer';
