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
      // downloadBlobWithCallbacks resolves only after GM_download onload fires,
      // so the browser has finished reading the blob URL by this point.
      await this.gm.downloadBlobWithCallbacks(url, filename);
    } finally {
      // Always revoke — covers both success and failure (onerror/ontimeout)
      // paths to prevent object URL leaks.
      URL.revokeObjectURL(url);
    }
  }
}
