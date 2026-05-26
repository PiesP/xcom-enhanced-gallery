// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Component Props and related type definitions
 */

import type { JSXElement } from 'solid-js';

/** Component child element type */
export type ComponentChildren =
  | JSXElement
  | string
  | number
  | boolean
  | null
  | undefined
  | ComponentChildren[];
