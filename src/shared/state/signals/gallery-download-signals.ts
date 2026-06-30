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

// Internal signal — exported for use by disposeGallerySignals and core signals
export const [_isProcessing, _setIsProcessing] = createSignal<boolean>(false);

export const downloadState = {
  get isProcessing(): boolean {
    return _isProcessing();
  },
};

/**
 * Sets the download processing state.
 * Used by download hooks to signal that a download operation is in progress,
 * which disables UI controls to prevent concurrent downloads.
 *
 * @param value - `true` when a download starts, `false` when it completes
 */
export function setDownloading(value: boolean): void {
  _setIsProcessing(value);
}
