/**
 * @fileoverview Global Events Wiring
 * @description Global event handler wiring and unwiring (pagehide only)
 * @module bootstrap/events
 */

import { logger } from '@shared/logging';
import { EventManager } from '@shared/services/event-manager';

/**
 * Event handler unregister function type
 */
export type Unregister = () => void;

/**
 * Wire global event handlers
 *
 * Subscribe to pagehide event to perform cleanup on page unload.
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
  const eventManager = EventManager.getInstance();
  const controller = new AbortController();

  const invokeOnce = (): void => {
    if (disposed) {
      return;
    }

    disposed = true;
    controller.abort();
    onBeforeUnload();
  };

  const handler: EventListener = () => {
    invokeOnce();
  };

  eventManager.addEventListener(window, 'pagehide', handler, {
    once: true,
    passive: true,
    signal: controller.signal,
    context: 'bootstrap:pagehide',
  });

  if (debugEnabled) {
    logger.debug('[events] 🧩 Global events wired (pagehide only)');
  }

  return () => {
    if (disposed) {
      return;
    }

    disposed = true;
    controller.abort();

    if (debugEnabled) {
      logger.debug('[events] 🧩 Global events unwired');
    }
  };
}
