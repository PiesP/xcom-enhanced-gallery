// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Tooltip component types.
 */

import type { JSXElement } from 'solid-js';

export type TooltipPlacement = 'top' | 'bottom';

export interface TooltipPosition {
  readonly x: number;
  readonly y: number;
  readonly actualPlacement: TooltipPlacement;
}

export interface TooltipProps {
  /** Tooltip text content */
  readonly content: string;
  /** Child elements to wrap with tooltip trigger */
  readonly children: JSXElement;
  /** Offset from trigger element in pixels (default: 6) */
  readonly offset?: number;
  /** Preferred placement relative to trigger (default: 'bottom') */
  readonly placement?: TooltipPlacement;
  /** Show delay in ms (default: 300) */
  readonly showDelay?: number;
  /** Hide delay in ms (default: 100) */
  readonly hideDelay?: number;
}
