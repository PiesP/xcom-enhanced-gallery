// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/** Minimum browser versions advertised by the userscript metadata and documentation. */
export const USERSCRIPT_BROWSER_SUPPORT = {
  chrome: '123',
  edge: '123',
  firefox: '128',
  safari: '17.5',
} as const;

/** Vite compilation targets corresponding to the advertised userscript support floor. */
export const USERSCRIPT_BUILD_TARGETS = ['chrome123', 'firefox128', 'safari17.5'] as const;
