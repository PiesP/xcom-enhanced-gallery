/**
 * @fileoverview Global Events Wiring
 * @description Global event handler wiring and unwiring (pagehide only)
 * @module bootstrap/events
 */

import { logger } from '../shared/logging';

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
  // BFCache compatibility: registering beforeunload can prevent browser's page snapshot (BFCache) loading
  // Cleanup is only performed in pagehide to preserve back button restoration quality
  const handler = (): void => {
    onBeforeUnload();
  };

  window.addEventListener('pagehide', handler);

  logger.debug('[events] 🧩 Global events wired (pagehide only)');

  return () => {
    window.removeEventListener('pagehide', handler);
    logger.debug('[events] 🧩 Global events unwired');
  };
}
