/**
 * @fileoverview Solid.js type re-exports (types-only module)
 * @description Type aliases for Solid.js JSX - use direct solid-js imports for runtime
 */

import type { JSX } from 'solid-js';

export type { JSX };

/**
 * JSX.Element type alias (rendered Solid.js component)
 */
export type JSXElement = JSX.Element;

/**
 * Children prop type alias (equivalent to JSXElement)
 */
export type ComponentChildren = JSX.Element;
