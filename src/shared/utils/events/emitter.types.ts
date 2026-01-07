/**
 * @fileoverview Event Emitter type definitions
 * @description Type contracts for lightweight event emitter
 */

/**
 * Type-safe event emitter interface.
 *
 * @template T - Record mapping event names to their respective payload types.
 */
export interface EventEmitterInterface<T extends Record<string, unknown>> {
  /**
   * Register a listener for a specific event.
   *
   * @template K - The event key.
   * @param event - Event name from the T type.
   * @param callback - Function called when the event is emitted.
   * @returns Function to unsubscribe the listener.
   */
  on<K extends keyof T>(event: K, callback: (data: T[K]) => void): () => void;

  /**
   * Emit an event to all registered listeners.
   *
   * @template K - The event key.
   * @param event - Event name from the T type.
   * @param data - Payload for the event.
   */
  emit<K extends keyof T>(event: K, data: T[K]): void;

  /**
   * Clear all listeners and dispose of the emitter.
   */
  dispose(): void;
}
