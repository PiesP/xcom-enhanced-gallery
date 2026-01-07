/**
 * @fileoverview Global event handler wiring for application lifecycle
 *
 * Provides global event listener management for critical application lifecycle events,
 * specifically handling page unload scenarios via the pagehide event. This module ensures
 * proper cleanup when the user navigates away from the page.
 *
 * ## Purpose
 *
 * - **Page Unload Handling**: Wire pagehide event to trigger application cleanup
 * - **Cleanup Coordination**: Ensure cleanup callbacks are invoked before page destruction
 * - **Resource Management**: Properly unregister event listeners to prevent memory leaks
 * - **Safe Disposal**: Prevent duplicate cleanup execution via disposal flag
 *
 * ## Event Strategy
 *
 * Uses `pagehide` event instead of alternatives:
 * - **pagehide**: Fires when page enters back/forward cache (reliable for cleanup)
 * - **beforeunload**: Less reliable, can be canceled, not used here
 * - **unload**: Deprecated and unreliable in modern browsers
 *
 * ## Implementation Details
 *
 * - **EventManager Integration**: Uses EventManager for centralized listener tracking
 * - **AbortController**: Enables clean cancellation of event listeners
 * - **Once Semantics**: Event fires once per page lifecycle (using `once: true`)
 * - **Passive Listeners**: Uses `passive: true` for performance optimization
 * - **Disposal Guard**: Prevents duplicate cleanup execution
 *
 * ## Bootstrap Context
 *
 * This function is called during the bootstrap phase after services are initialized.
 * The returned unregister function is stored for later invocation during manual cleanup
 * or when the application needs to reset its state.
 *
 * @module bootstrap/events
 */

import { logger } from '@shared/logging/logger';
import { EventManager } from '@shared/services/event-manager';

/**
 * Event handler unregister function type
 *
 * Function returned by `wireGlobalEvents` that removes all registered global event
 * listeners and prevents further event handling. Calling this function is idempotent -
 * it can be safely called multiple times without side effects.
 *
 * @example
 * ```typescript
 * const unregister = wireGlobalEvents(() => cleanup());
 * // Later, when cleanup is no longer needed
 * unregister();
 * ```
 */
export type Unregister = () => void;

/**
 * Wire global event handlers for application lifecycle management
 *
 * Registers a pagehide event listener that invokes the provided cleanup callback when
 * the user navigates away from the page. The event is wired with safety mechanisms to
 * ensure the callback executes exactly once, even if the event fires multiple times or
 * the unregister function is called.
 *
 * ## Behavior
 *
 * The function performs the following steps:
 * 1. **Environment Check**: Verify window object is available (skip in SSR/test contexts)
 * 2. **EventManager Setup**: Create AbortController and get EventManager instance
 * 3. **Listener Registration**: Wire pagehide event with once, passive, and signal options
 * 4. **Disposal Guard**: Set up flag to prevent duplicate cleanup execution
 * 5. **Debug Logging**: Log event wiring status in development mode
 *
 * ## Event Options
 *
 * - `once: true` - Event listener automatically removed after first invocation
 * - `passive: true` - Listener won't call preventDefault() (performance optimization)
 * - `signal` - AbortController signal enables programmatic cancellation
 * - `context` - Tracking label for EventManager debugging
 *
 * ## Safety Guarantees
 *
 * - **Idempotent Cleanup**: Callback executes at most once, even with multiple triggers
 * - **Safe Unregister**: Returned function can be called multiple times safely
 * - **No Window Context**: Returns noop function if window is unavailable (e.g., tests)
 * - **Abort Protection**: AbortController ensures listener is properly cleaned up
 *
 * @param onBeforeUnload - Callback function to execute when page is about to unload.
 *                         This should perform application cleanup (destroy services,
 *                         remove DOM listeners, clear timers, etc.)
 *
 * @returns Unregister function that removes the pagehide event listener and prevents
 *          the cleanup callback from executing if the event hasn't fired yet. This
 *          function is idempotent and safe to call multiple times.
 *
 * @example
 * ```typescript
 * // During bootstrap
 * const unregisterGlobalEvents = wireGlobalEvents(() => {
 *   console.log('Page is unloading, cleaning up...');
 *   cleanupServices();
 *   removeEventListeners();
 * });
 *
 * // Later, during manual cleanup (e.g., dev tools)
 * unregisterGlobalEvents();
 * ```
 *
 * @example
 * ```typescript
 * // In test environment (no window)
 * const unregister = wireGlobalEvents(() => {
 *   // This callback won't execute
 * });
 * unregister(); // Safe noop
 * ```
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
