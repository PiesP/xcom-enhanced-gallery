/**
 * @fileoverview ViewMode utility functions
 * @version 1.0.0 - Phase 380: Separated from core-types.ts (eliminate circular dependencies)
 */

import { VIEW_MODES } from '../../constants';
import type { ViewMode } from '../../constants';

/**
 * ViewMode validation function
 * @param mode String to validate
 * @returns ViewMode type guard
 *
 * @example
 * ```typescript
 * const mode = 'grid';
 * if (isValidViewMode(mode)) {
 *   // mode is narrowed to ViewMode type
 * }
 * ```
 */
export function isValidViewMode(mode: string): mode is ViewMode {
  return VIEW_MODES.includes(mode as ViewMode);
}

/**
 * Return default ViewMode
 */
export function getDefaultViewMode(): ViewMode {
  return VIEW_MODES[0];
}

/**
 * Return ViewMode array (read-only)
 */
export function getViewModes(): readonly ViewMode[] {
  return VIEW_MODES;
}
