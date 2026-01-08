/**
 * @fileoverview Global event handler wiring for application lifecycle.
 *
 * Registers a pagehide event listener to trigger cleanup when the page unloads.
 * Uses EventManager for centralized listener tracking and AbortController for safe cancellation.
 *
 * @module bootstrap/events
 */

import { logger } from '@shared/logging/logger';
import { EventManager } from '@shared/services/event-manager';

/**
 * Event handler unregister function type.
 * Idempotent; safe to call multiple times.
 */
export type Unregister = () => void;

/**
 * Wire pagehide event listener to invoke cleanup callback when user navigates away.
 *
 * Callback executes at most once via a disposal guard, even if the event fires
 * multiple times or the unregister function is called.
 *
 * Returns noop if window is unavailable (e.g., SSR or test contexts).
 *
 * @param onBeforeUnload - Callback to execute on pagehide event
 * @returns Unregister function that removes the listener and prevents callback execution
 */
export function wireGlobalEvents(onBeforeUnload: () => void): Unregister {
  const hasWindow = typeof window !== 'undefined' && !!window.addEventListener;
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
