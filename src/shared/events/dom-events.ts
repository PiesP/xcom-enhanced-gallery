/**
 * @fileoverview DOM Event Listener Management
 * @version 1.0.0
 *
 * Provides DOM event listener registration with AbortSignal-based cleanup.
 *
 * **Design Goals**:
 * - Safe element validation
 * - AbortSignal for automatic cleanup
 * - Context-based grouping
 * - Error handling with logging
 */

import { logger } from '@shared/logging';
import { EventManager } from '@shared/services/event-manager';
import { wireAbortSignal } from './abort-signal-wiring';
import type { Subscription, SubscriptionManager } from './event-context';

// ============================================================================
// Types
// ============================================================================

/**
 * DOM listener options with AbortSignal support
 */
export interface DOMListenerOptions extends AddEventListenerOptions {
  /** AbortSignal for automatic cleanup */
  signal?: AbortSignal;
  /** Context for grouping (e.g., 'gallery', 'toolbar') */
  context?: string;
}

/**
 * DOM event listener function type.
 *
 * Note: We intentionally accept typed event parameters (e.g. ErrorEvent)
 * and cast internally when wiring to DOM APIs, so call sites don't need
 * `as unknown as EventListener`.
 */
export type DOMListener<E extends Event = Event> = {
  bivarianceHack(event: E): void;
}['bivarianceHack'];

// ============================================================================
// Implementation
// ============================================================================

/**
 * DOM Event Manager
 *
 * @deprecated Use `EventManager` from `@shared/services/event-manager` for DOM listeners,
 * or `EventBus` from `@shared/events` when you need unified DOM + app events.
 *
 * This class remains for backward compatibility and now delegates registration to
 * `EventManager` to keep listener tracking consistent.
 */
export class DOMEventManager {
  constructor(private readonly subscriptionManager: SubscriptionManager) {}

  /**
   * Add DOM event listener with automatic cleanup support
   *
   * @param element - Target DOM element
   * @param type - Event type (e.g., 'click', 'keydown')
   * @param listener - Event handler function
   * @param options - Listener options including AbortSignal
   * @returns Subscription ID for manual removal
   *
   * @example
   * ```typescript
   * const controller = new AbortController();
   * const id = domEvents.addListener(
   *   document,
   *   'keydown',
   *   (e) => console.log(e.key),
   *   { signal: controller.signal, context: 'keyboard' }
   * );
   *
   * // Auto-cleanup on abort
   * controller.abort();
   * ```
   */
  public addListener<E extends Event = Event>(
    element: EventTarget,
    type: string,
    listener: DOMListener<E>,
    options: DOMListenerOptions = {}
  ): string {
    const { signal, context, ...listenerOptions } = options;
    const id = this.subscriptionManager.generateId('dom', context);

    const eventManager = EventManager.getInstance();

    // Check if already aborted
    if (signal?.aborted) {
      __DEV__ && logger.debug(`[DOMEventManager] Skipping aborted listener: ${type}`);
      return id;
    }

    // Validate element
    if (
      !element ||
      typeof (element as unknown as { addEventListener?: unknown }).addEventListener !== 'function'
    ) {
      __DEV__ &&
        logger.warn('[DOMEventManager] Invalid element for DOM listener', { type, context });
      return id;
    }

    try {
      const managedId = eventManager.addEventListener(
        element,
        type,
        listener as unknown as EventListener,
        context === undefined ? listenerOptions : { ...listenerOptions, context }
      );

      if (!managedId) {
        __DEV__ &&
          logger.debug(`[DOMEventManager] Skipping destroyed listener registration: ${type}`);
        return id;
      }

      // AbortSignal cleanup is wired via an event listener.
      // Ensure abort listeners are removed when the subscription is cleaned up
      // to avoid retaining closures for long-lived signals.
      let abortCleanup: (() => void) | null = null;

      // Create subscription entry
      const subscription: Subscription = {
        id,
        type: 'dom',
        context,
        cleanup: () => {
          try {
            eventManager.removeListener(managedId);
          } catch (error) {
            __DEV__ && logger.warn(`[DOMEventManager] Failed to remove listener: ${type}`, error);
          }

          abortCleanup?.();
          abortCleanup = null;
        },
      };

      // Store subscription
      this.subscriptionManager.add(subscription);

      // Wire up AbortSignal for automatic cleanup
      if (signal) {
        abortCleanup = wireAbortSignal(signal, () => this.subscriptionManager.remove(id)).cleanup;
      }

      __DEV__ && logger.debug(`[DOMEventManager] DOM listener added: ${type} (${id})`, { context });
      return id;
    } catch (error) {
      logger.error(`[DOMEventManager] Failed to add listener: ${type}`, error);
      return id;
    }
  }
}

/**
 * Add DOM event listener (standalone function)
 *
 * @param element - Target DOM element
 * @param type - Event type
 * @param listener - Event handler
 * @param options - Listener options
 * @param subscriptionManager - Subscription manager instance
 * @returns Subscription ID
 */
export function addDOMListener(
  element: EventTarget,
  type: string,
  listener: DOMListener,
  options: DOMListenerOptions,
  subscriptionManager: SubscriptionManager
): string {
  const manager = new DOMEventManager(subscriptionManager);
  return manager.addListener(element, type, listener, options);
}
