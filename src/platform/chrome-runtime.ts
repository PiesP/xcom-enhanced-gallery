// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Chrome/Firefox runtime namespace shim.
 *
 * Firefox MV3 supports both `chrome.*` (since Firefox 101) and `browser.*`
 * namespaces. Using `browser.*` is more canonical for Firefox and ensures
 * long-term compatibility. This shim prefers `browser` when available and
 * falls back to `chrome` for Chrome and older Firefox.
 */

declare const browser: typeof chrome | undefined;

export const browserApi = (globalThis as { browser?: typeof chrome }).browser ?? globalThis.chrome;
