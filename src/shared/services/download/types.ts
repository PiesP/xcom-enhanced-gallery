/**
 * Download Service Type Definitions
 *
 * This module exports type contracts for the download service layer.
 * Used throughout the download pipeline (Phase 310+) for progress tracking
 * and orchestration via callbacks.
 *
 * **Related Services**:
 * - {@link DownloadOrchestrator}: Download orchestration with concurrency control (Phase 310-B)
 * - {@link HttpRequestService}: HTTP download client with retry (Phase 310-B)
 *
 * **Import**:
 * ```typescript
 * import type { DownloadProgress } from '@shared/services/download/types';
 * ```
 *
 * @see {@link DownloadOrchestrator} for usage context
 * @since Phase 310 (basic download service)
 * @since Phase 310-B (orchestration with callbacks)
 */

/**
 * Download progress tracking information
 *
 * Represents the current state of a download operation, emitted via progress callbacks.
 * Typically used with {@link DownloadOrchestrator.zipMediaItems} for real-time UI updates
 * and progress visualization.
 *
 * **Progress Phases** (State Machine):
 *
 * 1. **"preparing"** (Initial state)
 *    - Emitted before any downloads begin
 *    - Typical values: current=0, percentage=0, filename=undefined
 *    - Use case: Show "Preparing download..." message
 *
 * 2. **"downloading"** (In progress)
 *    - Emitted frequently during active downloads
 *    - current = number of completed items
 *    - percentage = (current / total) * 100
 *    - filename = name of currently downloading file (if available)
 *    - Use case: Animated progress bar with per-file status
 *    - Performance: Called 100-1000+ times, keep callback <5ms
 *
 * 3. **"complete"** (Finished)
 *    - Emitted after all downloads finish and ZIP assembly completes
 *    - Typical values: current=total, percentage=100, filename=undefined
 *    - Use case: Show completion message, enable download button
 *
 * **Usage Example**:
 * ```typescript
 * // Real-time progress tracking for UI feedback
 * import type { DownloadProgress } from '@shared/services/download/types';
 * import { DownloadOrchestrator } from '@shared/services/download';
 *
 * const orchestrator = DownloadOrchestrator.getInstance();
 * const result = await orchestrator.zipMediaItems(items, {
 *   onProgress: (progress: DownloadProgress) => {
 *     // Phase 1: Preparing
 *     if (progress.phase === 'preparing') {
 *       updateUI({ status: 'Preparing download...', percentage: 0 });
 *     }
 *
 *     // Phase 2: Downloading
 *     if (progress.phase === 'downloading') {
 *       const status = progress.filename
 *         ? `Downloading: ${progress.filename}`
 *         : `Downloading ${progress.current}/${progress.total}`;
 *       updateUI({ status, percentage: progress.percentage });
 *     }
 *
 *     // Phase 3: Complete
 *     if (progress.phase === 'complete') {
 *       updateUI({ status: 'Download complete!', percentage: 100 });
 *     }
 *   }
 * });
 * ```
 *
 * **Performance Considerations**:
 * - Callbacks are **synchronous** (should complete in <5ms)
 * - Called frequently (100-1000+ times during large batch downloads)
 * - Avoid heavy computations in progress callback
 * - Recommended: Batch updates via requestAnimationFrame if many updates
 * - For UI frameworks: Debounce updates to avoid excessive re-renders
 *
 * **Integration Points**:
 * - {@link DownloadOrchestrator.zipMediaItems} emits via onProgress callback
 * - Used in download UI components for progress visualization
 * - Supports both console logging and UI update patterns
 *
 * @interface DownloadProgress
 * @property {('preparing' | 'downloading' | 'complete')} phase - Current download phase
 * @property {number} current - Number of completed/downloading items (0 to total)
 * @property {number} total - Total number of items to download
 * @property {number} percentage - Progress percentage (0 to 100)
 * @property {string} [filename] - Name of currently downloading file (phase='downloading' only)
 *
 * @see {@link DownloadOrchestrator.OrchestratorOptions} for callback signature
 * @see {@link DownloadOrchestrator.zipMediaItems} for usage context
 * @since Phase 310 (basic progress tracking)
 * @since Phase 310-B (orchestration with enhanced callbacks)
 */
export interface DownloadProgress {
  /**
   * Current phase of download operation
   *
   * - "preparing": Initial state before downloads begin
   * - "downloading": Active download in progress
   * - "complete": All downloads finished and ZIP assembled
   *
   * **Type**: Union of 3 string literals (not arbitrary string)
   */
  phase: "preparing" | "downloading" | "complete";

  /**
   * Number of completed/actively downloading items
   *
   * Range: 0 to total (inclusive)
   *
   * **Examples**:
   * - phase="preparing": current=0
   * - phase="downloading": current=5 (5 items completed, 6th downloading)
   * - phase="complete": current=total
   *
   * **Type**: Non-negative integer
   */
  current: number;

  /**
   * Total number of items to download
   *
   * Constant throughout the operation, used for progress calculations.
   *
   * **Calculation**: percentage = (current / total) * 100
   *
   * **Type**: Positive integer (>0)
   */
  total: number;

  /**
   * Download progress as percentage (0-100)
   *
   * Derived from current/total ratio, pre-calculated for UI convenience.
   *
   * **Formula**: Math.round((current / total) * 100)
   *
   * **Examples**:
   * - 0% = preparing state
   * - 50% = halfway through downloads
   * - 100% = complete state
   *
   * **Type**: Number 0 to 100 (inclusive)
   */
  percentage: number;

  /**
   * Name of the file currently being downloaded (optional)
   *
   * Only populated when phase="downloading", undefined otherwise.
   *
   * **Usage**: Display in UI: "Downloading: photo-123.jpg"
   *
   * **Examples**:
   * - phase="preparing": filename=undefined
   * - phase="downloading": filename="photo-123.jpg" or undefined (if not tracked)
   * - phase="complete": filename=undefined
   *
   * **Type**: Optional string
   */
  filename?: string;
}

/**
 * Orchestrator Item Interface
 *
 * Represents a single item to be processed by the download orchestrator.
 *
 * @interface OrchestratorItem
 * @property {string} url - The URL of the item to download
 * @property {string} desiredName - The desired filename before any collision resolution
 * @property {Blob} [blob] - Optional pre-fetched Blob data
 *
 * @since Phase 310-B (orchestration with Blob support)
 */
export interface OrchestratorItem {
  /**
   * The URL of the item to download
   *
   * **Type**: String (valid URL format)
   */
  url: string;

  /**
   * The desired filename before any collision resolution
   *
   * Used to specify the intended name of the file on download.
   *
   * **Type**: String (file name without path)
   */
  desiredName: string;

  /**
   * Optional pre-fetched Blob data
   *
   * Can be used to provide already available data for the item, bypassing the need to download.
   *
   * **Type**: Blob or Promise<Blob> or undefined
   */
  blob?: Blob | Promise<Blob> | undefined;
}

/**
 * Orchestrator Options Interface
 *
 * Configuration options for the download orchestrator's operation.
 *
 * @interface OrchestratorOptions
 * @property {number} [concurrency] - Maximum concurrent downloads (1 to 8)
 * @property {number} [retries] - Number of retry attempts on failure (0 or more)
 * @property {AbortSignal} [signal] - Optional abort signal to cancel operations
 * @property {function} [onProgress] - Optional progress callback function
 *
 * @since Phase 310-B (orchestration options)
 */
export interface OrchestratorOptions {
  /**
   * Maximum concurrent downloads (1 to 8)
   *
   * Controls how many downloads can occur simultaneously.
   *
   * **Default**: 4
   * **Type**: Integer (1 to 8)
   */
  concurrency?: number | undefined; // 1..8

  /**
   * Number of retry attempts on failure (0 or more)
   *
   * Specifies how many times to retry a download in case of failure.
   *
   * **Default**: 3
   * **Type**: Integer (0 or more)
   */
  retries?: number | undefined; // >= 0

  /**
   * Optional abort signal to cancel operations
   *
   * Allows the caller to cancel the download operation by aborting the signal.
   *
   * **Type**: AbortSignal or undefined
   */
  signal?: AbortSignal | undefined;

  /**
   * Optional progress callback function
   *
   * Called with progress updates during the download operation.
   *
   * **Type**: Function (progress: DownloadProgress) => void
   */
  onProgress?: ((progress: DownloadProgress) => void) | undefined;
}

/**
 * Download Options Interface
 *
 * Extended options for download operations, including ZIP file configuration.
 *
 * @interface DownloadOptions
 * @property {string} [zipFilename] - Optional custom filename for the resulting ZIP file
 * @property {Blob} [blob] - Optional Blob data for the download
 * @property {Map<string, Blob>} [prefetchedBlobs] - Optional map of pre-fetched Blobs
 *
 * @since Phase 310-B (download options extension)
 */
export interface DownloadOptions extends OrchestratorOptions {
  /**
   * Optional custom filename for the resulting ZIP file
   *
   * If specified, overrides the default ZIP filename.
   *
   * **Type**: String (valid file name)
   */
  zipFilename?: string;

  /**
   * Optional Blob data for the download
   *
   * Can be used to provide the download data directly as a Blob.
   *
   * **Type**: Blob or undefined
   */
  blob?: Blob;

  /**
   * Optional map of pre-fetched Blobs
   *
   * A map of URLs to Blobs that have been pre-fetched, allowing for immediate use.
   *
   * **Type**: Map<string, Blob | Promise<Blob>> or undefined
   */
  prefetchedBlobs?: Map<string, Blob | Promise<Blob>>;
}

/**
 * Single Download Result Interface
 *
 * Represents the result of a single download operation.
 *
 * @interface SingleDownloadResult
 * @property {boolean} success - Indicates if the download was successful
 * @property {string} [filename] - The filename of the downloaded item (if successful)
 * @property {string} [error] - Error message if the download failed
 *
 * @since Phase 310-B (single download result)
 */
export interface SingleDownloadResult {
  /**
   * Indicates if the download was successful
   *
   * **Type**: Boolean
   */
  success: boolean;

  /**
   * The filename of the downloaded item (if successful)
   *
   * **Type**: String (file name)
   */
  filename?: string;

  /**
   * Error message if the download failed
   *
   * **Type**: String (error description)
   */
  error?: string | undefined;
}

/**
 * ZIP Result Interface
 *
 * Represents the result of a ZIP operation after downloading multiple files.
 *
 * @interface ZipResult
 * @property {number} filesSuccessful - Number of files successfully added to the ZIP
 * @property {Array<{ url: string; error: string }>} failures - List of failed downloads with error details
 * @property {Uint8Array} zipData - Raw ZIP file bytes
 * @property {string[]} usedFilenames - List of filenames used in the ZIP, in order of completion
 *
 * @since Phase 310-B (ZIP result details)
 */
export interface ZipResult {
  /**
   * Number of files successfully added to the ZIP
   *
   * **Type**: Non-negative integer
   */
  filesSuccessful: number;

  /**
   * List of failed downloads with error details
   *
   * **Type**: Array of objects with url and error properties
   */
  failures: Array<{ url: string; error: string }>;

  /**
   * Raw ZIP file bytes
   *
   * **Type**: Uint8Array
   */
  zipData: Uint8Array; // raw zip bytes

  /**
   * List of filenames used in the ZIP, in order of completion
   *
   * **Type**: Array of strings
   */
  usedFilenames: string[]; // in order of completion
}

/**
 * Download Data Source Type
 *
 * Represents the source of downloaded data for a single item.
 *
 * @type DownloadDataSource
 * @property {'dom' | 'cache' | 'network'} - Source type
 *
 * @since Phase 310-B (download data source)
 */
export type DownloadDataSource = "dom" | "cache" | "network";

/**
 * Single Item Download Result Interface
 *
 * Represents the result of downloading a single item, including its data and source.
 *
 * @interface SingleItemDownloadResult
 * @property {Uint8Array} data - The downloaded data as raw bytes
 * @property {DownloadDataSource} source - The source of the downloaded data
 *
 * @since Phase 310-B (single item download result)
 */
export interface SingleItemDownloadResult {
  /**
   * The downloaded data as raw bytes
   *
   * **Type**: Uint8Array
   */
  data: Uint8Array;

  /**
   * The source of the downloaded data
   *
   * **Type**: DownloadDataSource
   */
  source: DownloadDataSource;
}

/**
 * Bulk Download Result Interface
 *
 * Represents the result of a bulk download operation, including summary and error details.
 *
 * @interface BulkDownloadResult
 * @property {boolean} success - Indicates if the bulk download was successful
 * @property {'success' | 'partial' | 'error'} status - Status of the bulk download
 * @property {number} filesProcessed - Total number of files processed in the batch
 * @property {number} filesSuccessful - Number of files successfully downloaded
 * @property {string} [filename] - The filename of the resulting file (if any)
 * @property {string} [error] - Error message if the bulk download failed
 * @property {Array<{ url: string; error: string }> | undefined} [failures] - List of failed downloads (if any)
 * @property {import("@shared/types/result.types").ErrorCode} code - Error code associated with the result
 *
 * @since Phase 310-B (bulk download result)
 */
import type { ErrorCode } from "@shared/types/result.types";

export interface BulkDownloadResult {
  /**
   * Indicates if the bulk download was successful
   *
   * **Type**: Boolean
   */
  success: boolean;

  /**
   * Status of the bulk download
   *
   * - "success": All files downloaded successfully
   * - "partial": Some files failed, some succeeded
   * - "error": Entire operation failed
   *
   * **Type**: String literal union
   */
  status: "success" | "partial" | "error";

  /**
   * Total number of files processed in the batch
   *
   * **Type**: Non-negative integer
   */
  filesProcessed: number;

  /**
   * Number of files successfully downloaded
   *
   * **Type**: Non-negative integer
   */
  filesSuccessful: number;

  /**
   * The filename of the resulting file (if any)
   *
   * **Type**: String (file name)
   */
  filename?: string | undefined;

  /**
   * Error message if the bulk download failed
   *
   * **Type**: String (error description)
   */
  error?: string | undefined;

  /**
   * List of failed downloads (if any)
   *
   * **Type**: Array of objects with url and error properties or undefined
   */
  failures?: Array<{ url: string; error: string }> | undefined;

  /**
   * Error code associated with the result
   *
   * **Type**: ErrorCode (imported type)
   */
  code: ErrorCode;
}
