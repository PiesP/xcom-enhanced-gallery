/**
 * @fileoverview Toolbar State Utilities
 * @description Pure utility functions (not hooks)
 *
 * Phase 2: Helper functions separated from shared/hooks
 * - Convert toolbar state to data attribute state
 * - Generate toolbar class names
 */

import type { ToolbarState, ToolbarDataState } from '@shared/types/toolbar.types';

// Phase 2: Re-export types for backward compatibility
export type { ToolbarDataState } from '@shared/types/toolbar.types';

export function getToolbarDataState(state: ToolbarState): ToolbarDataState {
  if (state.hasError) return 'error';
  if (state.isDownloading) return 'downloading';
  if (state.isLoading) return 'loading';
  return 'idle';
}

/**
 * Toolbar class name generation utility
 *
 * @description
 * Generate toolbar CSS class names based on state.
 *
 * @param state - Toolbar state object
 * @param baseClassName - Base class name
 * @param additionalClassNames - Additional class names
 * @returns Combined class name string
 */
export function getToolbarClassName(
  state: ToolbarState,
  baseClassName: string,
  ...additionalClassNames: string[]
): string {
  const classNames = [baseClassName];

  if (state.needsHighContrast) {
    classNames.push('highContrast');
  }

  classNames.push(...additionalClassNames.filter(Boolean));

  return classNames.join(' ');
}
