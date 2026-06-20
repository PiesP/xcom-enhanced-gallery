// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Download state — tracks whether a download operation is in progress.
 */

import { createSignal } from 'solid-js';

const [_isProcessing, _setIsProcessing] = createSignal<boolean>(false);

export const downloadState = {
  get isProcessing(): boolean {
    return _isProcessing();
  },
};

/**
 * Sets the download processing state.
 */
export function setDownloading(value: boolean): void {
  _setIsProcessing(value);
}
