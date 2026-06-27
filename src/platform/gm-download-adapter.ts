// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * GM (userscript) download adapter.
 *
 * Wraps GM_download for userscript environments.
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
      await this.gm.download(url, filename);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}
