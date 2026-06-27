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
    const url = URL.createObjectURL(blob);
    try {
      await this.gm.downloadBlobWithCallbacks(url, filename);
    } catch (error) {
      // Revoke on error — download never started or failed.
      URL.revokeObjectURL(url);
      throw error;
    }
    // Success: revoke after download completes (onload fired).
    URL.revokeObjectURL(url);
  }
}
