// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { PlatformType } from './types';

export function detectPlatform(): PlatformType {
  if (
    typeof chrome !== 'undefined' &&
    chrome.runtime?.id &&
    typeof chrome.storage?.local !== 'undefined'
  ) {
    return 'mv3-extension';
  }
  return 'userscript';
}

export const IS_MV3: boolean = detectPlatform() === 'mv3-extension';
export const IS_USERSCRIPT: boolean = detectPlatform() === 'userscript';
