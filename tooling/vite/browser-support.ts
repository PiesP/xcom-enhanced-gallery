// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/** Current stable engine baseline for the native gallery dialog and CSS anchors (2026-11). */
export const USERSCRIPT_BROWSER_SUPPORT = {
  chrome: '157',
  edge: '157',
  firefox: '159',
  safari: '27.2',
} as const;

/** Syntax targets align with the selected engines; runtime APIs need separate browser checks. */
export const USERSCRIPT_BUILD_TARGETS = ['chrome157', 'firefox159', 'safari27.2'] as const;
