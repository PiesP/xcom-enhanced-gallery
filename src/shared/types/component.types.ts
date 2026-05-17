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
