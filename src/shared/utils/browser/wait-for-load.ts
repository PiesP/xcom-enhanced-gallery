/**
 * @fileoverview Window load event wait utility
 * @version 1.0.0 - Phase 289: Delay gallery rendering until load completion
 *
 * Initialize gallery after document and sub-resources (images, fonts, etc.) are fully loaded
 * to prevent FOUC (Flash of Unstyled Content) similar phenomena and image decode races.
 */

import { logger } from '../../logging';
import { safeWindow } from './safe-browser';
import { globalTimerManager } from '../timer-management';

/**
 * Window load event timeout (milliseconds)
 * @default 8000 - 8 seconds
 */
const DEFAULT_LOAD_TIMEOUT = 8000;

/**
 * Window load completion state
 */
type LoadState = 'complete' | 'waiting' | 'timeout';

/**
 * Wait for Window load event.
 *
 * Behavior:
 * - If already load complete, resolve immediately
 * - If still loading, wait for load event
 * - If timeout (default 8s) reached, resolve (prevent initialization skip)
 *
 * @param timeoutMs - Timeout duration (milliseconds)
 * @returns Promise<LoadState> - Completion state
 *
 * @example
 * ```typescript
 * const state = await waitForWindowLoad();
 * if (state === 'complete') {
 *   console.log('Page was already loaded.');
 * } else if (state === 'waiting') {
 *   console.log('Waited for load event.');
 * } else {
 *   console.log('Proceeding due to timeout.');
 * }
 * ```
 */
export async function waitForWindowLoad(
  timeoutMs: number = DEFAULT_LOAD_TIMEOUT
): Promise<LoadState> {
  const win = safeWindow();

  // If not in browser environment (tests etc.), return immediately
  if (!win) {
    logger.debug('[waitForWindowLoad] Window not available, returning immediately');
    return 'complete';
  }

  // If already load complete
  if (win.document.readyState === 'complete') {
    logger.debug('[waitForWindowLoad] Document already loaded');
    return 'complete';
  }

  logger.debug('[waitForWindowLoad] Waiting for window load event', {
    readyState: win.document.readyState,
    timeoutMs,
  });

  return new Promise<LoadState>(resolve => {
    let resolved = false;

    const handleLoad = () => {
      if (resolved) return;
      resolved = true;
      globalTimerManager.clearTimeout(timeoutId);
      logger.debug('[waitForWindowLoad] Load event received');
      resolve('waiting');
    };

    const handleTimeout = () => {
      if (resolved) return;
      resolved = true;
      win.removeEventListener('load', handleLoad);
      logger.warn('[waitForWindowLoad] Load timeout reached, proceeding anyway', {
        timeoutMs,
      });
      resolve('timeout');
    };

    // Register load event listener
    win.addEventListener('load', handleLoad, { once: true });

    // Set timeout
    const timeoutId = globalTimerManager.setTimeout(handleTimeout, timeoutMs);
  });
}
