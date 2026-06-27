// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { IS_MV3 } from './detect';
import { GMStorageAdapter } from './gm-storage-adapter';
import { MV3StorageAdapter } from './mv3-storage-adapters';
import type { StorageAdapter } from './types';

let _storageAdapter: StorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
  if (_storageAdapter) return _storageAdapter;
  _storageAdapter = IS_MV3 ? new MV3StorageAdapter() : new GMStorageAdapter();
  return _storageAdapter;
}
