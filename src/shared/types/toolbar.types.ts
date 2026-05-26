// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Toolbar Types - Shared UI State Types
 */

/** Toolbar data state (business logic) */
export type ToolbarDataState = 'idle' | 'loading' | 'downloading' | 'error';

import type { Accessor } from 'solid-js';

/** Toolbar UI state object (signals for reactivity) */
export interface ToolbarState {
  /** Download in progress signal */
  readonly isDownloading: Accessor<boolean>;
  /** Loading signal */
  readonly isLoading: Accessor<boolean>;
  /** Error occurred signal */
  readonly hasError: Accessor<boolean>;
}

/**
 * Toolbar actions interface.
 *
 * @description Actions that modify ToolbarState
 */
export interface ToolbarActions {
  /** Set download state */
  setDownloading(value: boolean): void;
  /** Set loading state */
  setLoading(value: boolean): void;
  /** Set error state */
  setError(value: boolean): void;
  /** Reset state */
  resetState(): void;
}
