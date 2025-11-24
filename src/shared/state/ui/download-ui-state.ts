/**
 * @fileoverview Helpers for determining download UI busy state.
 */

export interface DownloadUiStateContext {
  readonly galleryLoading?: boolean;
  readonly downloadProcessing?: boolean;
}

export function isDownloadUiBusy(context: DownloadUiStateContext): boolean {
  return Boolean(context.downloadProcessing);
}
