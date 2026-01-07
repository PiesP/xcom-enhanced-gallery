/**
 * @fileoverview Solid.js Type Re-exports
 * @version 7.0.0 - Types-only module (all runtime APIs removed)
 *
 * This module provides convenient type aliases for Solid.js JSX types.
 * All runtime functionality uses direct solid-js imports.
 *
 * @example
 * ```typescript
 * // ✅ Runtime APIs: Use direct solid-js imports
 * import { createSignal, createEffect } from 'solid-js';
 *
 * // ✅ Types: Can use either approach
 * import type { JSX } from 'solid-js';
 * import type { JSXElement, ComponentChildren } from '@shared/external/vendors';
 * ```
 */

import type { JSX } from 'solid-js';

// Re-export types only - all runtime imports should use solid-js directly
export type { JSX };

/**
 * Alias for JSX.Element - a rendered Solid.js component.
 * Preferred import path for component return types across the project.
 */
export type JSXElement = JSX.Element;

/**
 * Alias for JSX.Element - children prop type.
 * Equivalent to JSXElement; use JSXElement for consistency.
 */
export type ComponentChildren = JSX.Element;
