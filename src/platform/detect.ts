// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { PlatformType } from './types';

function detectPlatform(): PlatformType {
  try {
    if (
      typeof chrome !== 'undefined' &&
      chrome.runtime?.id &&
      typeof chrome.storage?.local !== 'undefined'
    ) {
      return 'mv3-extension';
    }
  } catch {
    // chrome API unavailable or context invalidated — fall through
  }
  return 'userscript';
}

// Platform detection at module load time.
// NOTE: In MV3 context, once the service worker is terminated and restarted,
// the module is re-evaluated, so these values stay correct within a single
// extension context lifecycle. For runtime re-detection, use detectPlatform() directly.
const _platform = detectPlatform();
export const IS_MV3: boolean = _platform === 'mv3-extension';
