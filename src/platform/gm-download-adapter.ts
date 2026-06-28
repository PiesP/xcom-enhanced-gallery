// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * GM (userscript) download adapter.
 *
 * Wraps GM_download for userscript environments.
 * Uses the options-object form with onload/onerror callbacks to properly
 * track download completion and errors.
 */

import { getUserscript } from '@shared/external/userscript/adapter';
import type { DownloadAdapter } from './types';

export class GMDownloadAdapter implements DownloadAdapter {
  private get gm() {
    return getUserscript();
  }

  async download(url: string, filename: string): Promise<void> {
    return this.gm.download(url, filename);
  }

  async downloadBlob(blob: Blob, filename: string): Promise<void> {
    // Use the unified download method which handles all GM API variants
    // and falls back to blob-based download if needed.
    await this.gm.downloadBlob(blob, filename);
  }
}
