/**
 * @fileoverview Download UI state determination utilities.
 *
 * Provides helper functions to determine whether the download UI should display
 * a busy state based on download processing status.
 */

/**
 * Context object for determining download UI busy state.
 *
 * @property galleryLoading - Reserved for future use (gallery loading status)
 * @property downloadProcessing - True when a download task is actively processing
 */
interface DownloadUiStateContext {
  readonly galleryLoading?: boolean;
  readonly downloadProcessing?: boolean;
}

/**
 * Determines if the download UI should display a busy/loading state.
 *
 * The UI is considered busy when any download task is currently processing.
 * Other UI states (gallery loading) are reserved for future expansion.
 *
 * @param context - Download UI state context containing processing flags
 * @returns True if any download operation is in progress, false otherwise
 */
export function isDownloadUiBusy(context: DownloadUiStateContext): boolean {
  return context.downloadProcessing ?? false;
}
