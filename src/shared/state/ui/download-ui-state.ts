/**
 * @fileoverview Helpers for determining download UI busy state.
 */

interface DownloadUiStateContext {
  readonly galleryLoading?: boolean;
  readonly downloadProcessing?: boolean;
}

export function isDownloadUiBusy(context: DownloadUiStateContext): boolean {
  return !!context.downloadProcessing;
}
