/**
 * @fileoverview Event Emitter (Phase 63 - Step 1)
 * @description Lightweight type-safe event system
 *
 * Purpose:
 * - Propagate gallerySignals navigation events
 * - Maintain loose coupling (between useGalleryFocusTracker and gallery.signals)
 * - Minimal bundle size (+~200 bytes)
 *
 * Guidance:
 * - Use AppEventManager (@shared/events/app-events) for application-wide events.
 * - Use this emitter only for feature-local, short-lived coordination where
 *   AbortSignal / subscription tracking is not required.
 */

import { logger } from '@shared/logging';

/**
 * Create type-safe event emitter
 *
 * @example
 * ```ts
 * const emitter = createEventEmitter<{
 *   'user:login': { userId: string };
 *   'user:logout': { userId: string };
 * }>();
 *
 * const unsubscribe = emitter.on('user:login', ({ userId }) => {
 *   console.log(`User ${userId} logged in`);
 * });
 *
 * emitter.emit('user:login', { userId: '123' });
 * unsubscribe();
 * ```
 */
export function createEventEmitter<T extends Record<string, unknown>>() {
  const listeners = new Map<keyof T, Set<(data: unknown) => void>>();

  return {
    /**
     * Register event listener
     * @returns Unsubscribe function
     */
    on<K extends keyof T>(event: K, callback: (data: T[K]) => void): () => void {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event)!.add(callback as (data: unknown) => void);

      return () => {
        listeners.get(event)?.delete(callback as (data: unknown) => void);
      };
    },

    /**
     * Emit event (synchronous execution)
     * Listener errors are isolated - one listener failure doesn't prevent others
     */
    emit<K extends keyof T>(event: K, data: T[K]): void {
      const eventListeners = listeners.get(event);
      if (!eventListeners) {
        return;
      }

      eventListeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          // Error isolation: one listener failure doesn't prevent other listeners
          if (__DEV__) {
            logger.error(`[EventEmitter] Listener error for event "${String(event)}":`, error);
          }
        }
      });
    },

    /**
     * Remove all listeners (optional)
     */
    dispose(): void {
      listeners.clear();
    },
  };
}
