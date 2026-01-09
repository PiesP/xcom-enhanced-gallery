/**
 * @fileoverview Download UI state determination utilities.
 */

/**
 * Context object for determining download UI busy state.
 * @property downloadProcessing - True when a download task is actively processing
 */
export interface DownloadUiStateContext {
  readonly downloadProcessing?: boolean;
}

/**
 * Determines if the download UI should display a busy state.
 * @param context - Download UI state context containing processing flags
 * @returns True if download operation is in progress, false otherwise
 */
export function isDownloadUiBusy(context: DownloadUiStateContext): boolean {
  return context.downloadProcessing ?? false;
}
