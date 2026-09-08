// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Gallery download state management signals.
 *
 * Tracks whether a download operation is in progress to disable
 * UI controls and prevent concurrent downloads. Separated from
 * core gallery signals to keep the main signal file focused on
 * gallery lifecycle.
 */

import { createSignal } from 'solid-js';

export type DownloadStatus = 'idle' | 'working' | 'handedOff' | 'error';

// Internal signal — exported for use by disposeGallerySignals.
export const [_downloadStatus, _setDownloadStatus] = createSignal<DownloadStatus>('idle');

export const downloadState = {
  get status(): DownloadStatus {
    return _downloadStatus();
  },
  get isProcessing(): boolean {
    return _downloadStatus() === 'working';
  },
};

/**
 * Records only lifecycle states observable at the gallery boundary. "handedOff"
 * means that the download adapter accepted the request; it does not assert
 * that the browser saved the file to disk.
 *
 * @param status - Current observable download lifecycle state
 */
export function setDownloadStatus(status: DownloadStatus): void {
  _setDownloadStatus(status);
}
