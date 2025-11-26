/**
 * @fileoverview Global Events Wiring
 * @description Global event handler wiring and unwiring (pagehide only)
 * @module bootstrap/events
 */

import { logger } from '@shared/logging';

/**
 * Event handler unregister function type
 */
export type Unregister = () => void;

/**
 * Wire global event handlers
 *
 * Subscribe to beforeunload and pagehide events to perform cleanup on page unload.
 * Registered only on call, can be unregistered anytime via returned function.
 *
 * @param onBeforeUnload - Callback to execute on page unload
 * @returns Event handler unregister function
 */
export function wireGlobalEvents(onBeforeUnload: () => void): Unregister {
  const hasWindow = typeof window !== 'undefined' && Boolean(window.addEventListener);
  const debugEnabled = __DEV__;

  if (!hasWindow) {
    if (debugEnabled) {
      logger.debug('[events] 🧩 Global events wiring skipped (no window context)');
    }
    return () => {
      /* noop */
    };
  }

  let disposed = false;

  const invokeOnce = (): void => {
    if (disposed) {
      return;
    }

    disposed = true;
    onBeforeUnload();
  };

  const handler = (): void => {
    invokeOnce();
  };

  window.addEventListener('pagehide', handler, { once: true, passive: true });

  if (debugEnabled) {
    logger.debug('[events] 🧩 Global events wired (pagehide only)');
  }

  return () => {
    if (disposed) {
      return;
    }

    disposed = true;
    window.removeEventListener('pagehide', handler);

    if (debugEnabled) {
      logger.debug('[events] 🧩 Global events unwired');
    }
  };
}
