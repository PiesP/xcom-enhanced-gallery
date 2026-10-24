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
export interface BulkDownloadOutcome {
  /** The count refers to the media shown when Download all was requested. */
  readonly total: number;
  /** Files included in the ZIP accepted by the browser, never merely prepared. */
  readonly included: number;
  readonly omitted: number;
  readonly handedOff: boolean;
  readonly reason: 'none' | 'resourceLimit' | 'sourceUnavailable' | 'zipSaveFailed' | 'other';
  readonly sourceUnavailable: boolean;
}

// Internal signal — exported for use by disposeGallerySignals.
export const [_downloadStatus, _setDownloadStatus] = createSignal<DownloadStatus>('idle');
const [bulkOutcome, setBulkOutcomeSignal] = createSignal<BulkDownloadOutcome | null>(null);

export const downloadState = {
  get status(): DownloadStatus {
    return _downloadStatus();
  },
  get isProcessing(): boolean {
    return _downloadStatus() === 'working';
  },
  get bulkOutcome(): BulkDownloadOutcome | null {
    return bulkOutcome();
  },
};

export function setBulkDownloadOutcome(outcome: BulkDownloadOutcome | null): void {
  setBulkOutcomeSignal(outcome);
}

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
