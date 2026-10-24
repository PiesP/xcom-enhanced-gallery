// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { gallerySignals, setError } from '@shared/state/signals/gallery.signals';
import {
  downloadState,
  setBulkDownloadOutcome,
  setDownloadStatus,
} from '@shared/state/signals/gallery-download-signals';

/** Dismiss the result and only the live error owned by that bulk download. */
export function dismissBulkDownloadOutcome(): void {
  if (gallerySignals.errorOwner === 'bulkDownload') {
    setError(null);
  }
  if (downloadState.status !== 'working') {
    setDownloadStatus('idle');
  }
  setBulkDownloadOutcome(null);
}
