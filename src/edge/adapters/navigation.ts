/**
 * @fileoverview Navigation adapter for the Edge layer
 * @description Provides a browser navigation implementation for command-runtime navigation commands.
 */

import type { NavigateMode } from '@core/cmd';

interface NavigateInput {
  readonly url: string;
  readonly mode: NavigateMode;
  readonly target?: '_self' | '_blank';
}

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
