/**
 * Navigation adapter for Edge layer. Bridges command-runtime with browser navigation APIs.
 * Supports in-place (assign) and new-window (open) navigation modes.
 *
 * @module edge/adapters/navigation
 */

import type { NavigateMode } from '@core/cmd';

/**
 * Navigation request input parameters
 */
interface NavigateInput {
  /** URL to navigate to (absolute or relative) */
  readonly url: string;

  /** Navigation mode ('assign' for in-place, 'open' for new window) */
  readonly mode: NavigateMode;

  /** Window target ('_self' or '_blank', defaults based on mode) */
  readonly target?: '_self' | '_blank';
}

/**
 * Perform browser navigation with mode-based routing and error handling
 */
export async function navigate(input: NavigateInput): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('window is not available');
  }

  if (input.mode === 'assign') {
    if (typeof window.location?.assign === 'function') {
      window.location.assign(input.url);
      return;
    }

    // Fallback for non-standard environments.
    window.location.href = input.url;
    return;
  }

  const target = input.target ?? '_blank';
  const opened = window.open(input.url, target, 'noopener,noreferrer');
  if (!opened) {
    throw new Error('PopupBlocked');
  }
}
