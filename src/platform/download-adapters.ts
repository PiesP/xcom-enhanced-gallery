// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { IS_MV3 } from './detect';
import { GMDownloadAdapter } from './gm-download-adapter';
import { MV3DownloadAdapter } from './mv3-download-adapters';
import type { DownloadAdapter } from './types';

let _downloadAdapter: DownloadAdapter | null = null;

export function getDownloadAdapter(): DownloadAdapter {
  if (_downloadAdapter) return _downloadAdapter;
  _downloadAdapter = IS_MV3 ? new MV3DownloadAdapter() : new GMDownloadAdapter();
  return _downloadAdapter;
}
