// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { createAdapter } from './adapter-factory';
import { GMStorageAdapter } from './gm-storage-adapter';
import { MV3StorageAdapter } from './mv3-storage-adapters';
import type { StorageAdapter } from './types';

/**
 * Returns the singleton storage adapter for the current platform.
 *
 * - MV3 extension: {@link MV3StorageAdapter} (`chrome.storage.local`)
 * - Userscript: {@link GMStorageAdapter} (`GM_getValue`/`GM_setValue`)
 */
export const getStorageAdapter: () => StorageAdapter = createAdapter(
  () => new MV3StorageAdapter(),
  () => new GMStorageAdapter()
);
