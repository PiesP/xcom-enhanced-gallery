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

import type { EventEmitterInterface } from './emitter.types';

/**
 * Create a type-safe event emitter with minimal overhead.
 *
 * @template T - Record mapping event names to their data payloads.
 *   Keys are event names (strings), values are payload types.
 * @returns Type-safe emitter with `on`, `emit`, and `dispose` methods.
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
 * unsubscribe(); // Stop listening
 * ```
 */
export function createEventEmitter<T extends Record<string, unknown>>(): EventEmitterInterface<T> {
  const listeners = new Map<keyof T, Set<(data: unknown) => void>>();

  return {
    /**
     * Register an event listener.
     *
     * @template K - The specific event key.
     * @param event - Event name from the T type.
     * @param callback - Handler called with the event payload.
     * @returns Unsubscribe function; calling it removes the listener.
     */
    on<K extends keyof T>(event: K, callback: (data: T[K]) => void): () => void {
      const eventListeners = listeners.get(event);

      if (eventListeners) {
        eventListeners.add(callback as (data: unknown) => void);
      } else {
        listeners.set(event, new Set([callback as (data: unknown) => void]));
      }

      return () => {
        const currentListeners = listeners.get(event);
        if (currentListeners) {
          currentListeners.delete(callback as (data: unknown) => void);
        }
      };
    },

    /**
     * Emit an event to all registered listeners (synchronous execution).
     *
     * Listener errors are isolated: one listener's exception does not prevent
     * other listeners from being called.
     *
     * @template K - The specific event key.
     * @param event - Event name from the T type.
     * @param data - Payload matching the event's data type.
     */
    emit<K extends keyof T>(event: K, data: T[K]): void {
      const eventListeners = listeners.get(event);
      if (!eventListeners) {
        return;
      }

      for (const callback of eventListeners) {
        try {
          callback(data);
        } catch {
          // Intentionally ignore listener errors to prevent cascade failures.
        }
      }
    },

    /**
     * Remove all listeners and clear internal state (optional cleanup).
     */
    dispose(): void {
      listeners.clear();
    },
  };
}
