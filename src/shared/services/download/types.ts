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
  phase: 'preparing' | 'downloading' | 'complete';

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
   * Constant throughout operation, used for progress calculations.
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
