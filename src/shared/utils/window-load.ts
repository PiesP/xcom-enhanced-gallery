/**
 * @file Window Load Wait Utility
 * @description Promise utility to wait for window load event
 * - Resolves immediately if already loaded (document.readyState === 'complete')
 * - Resolves with false on timeout if load doesn't occur within specified time
 * - Timers managed by globalTimerManager for test/cleanup safety
 */

import { logger } from '@shared/logging';
import { globalTimerManager } from './timer-management';

export interface WaitForWindowLoadOptions {
  /** Max wait time (ms). Default 8000ms */
  timeoutMs?: number;
  /** For testing: ignore fast-path (readyState === 'complete') and force load event path */
  forceEventPath?: boolean;
}

/**
 * Wait for window load event
 * @returns true (load detected) | false (timeout)
 */
export function waitForWindowLoad(options: WaitForWindowLoadOptions = {}): Promise<boolean> {
  const { timeoutMs = 8000, forceEventPath = false } = options;

  // If already loaded, resolve immediately
  if (!forceEventPath && document.readyState === 'complete') {
    if (import.meta.env.DEV) {
      logger.debug('[window-load] already complete');
    }
    return Promise.resolve(true);
  }

  return new Promise<boolean>(resolve => {
    let done = false;

    const onLoad = () => {
      if (done) return;
      done = true;
      if (import.meta.env.DEV) {
        logger.debug('[window-load] load event received');
      }
      cleanup();
      resolve(true);
    };

    const onTimeout = () => {
      if (done) return;
      done = true;
      logger.warn('[window-load] timeout reached before load', { timeoutMs });
      cleanup();
      resolve(false);
    };

    const cleanup = () => {
      window.removeEventListener('load', onLoad);
      if (timeoutId) {
        globalTimerManager.clearTimeout(timeoutId);
      }
    };

    // Register event (PC-only policy compliant - load is a Window event)
    window.addEventListener('load', onLoad, { once: true });

    const timeoutId = globalTimerManager.setTimeout(onTimeout, timeoutMs);
  });
}
