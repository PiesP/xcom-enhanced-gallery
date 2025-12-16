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
import {
  addListener as addListenerManaged,
  removeEventListenerManaged,
} from '@shared/utils/events/core/listener-manager';
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

// ============================================================================
// Implementation
// ============================================================================

/**
 * DOM Event Manager
 *
 * Manages DOM event listener registration with automatic cleanup support.
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
  public addListener(
    element: EventTarget,
    type: string,
    listener: EventListener,
    options: DOMListenerOptions = {}
  ): string {
    const { signal, context, ...listenerOptions } = options;
    const id = this.subscriptionManager.generateId('dom', context);

    // Check if already aborted
    if (signal?.aborted) {
      logger.debug(`[DOMEventManager] Skipping aborted listener: ${type}`);
      return id;
    }

    // Validate element
    if (!element || typeof element.addEventListener !== 'function') {
      logger.warn('[DOMEventManager] Invalid element for DOM listener', { type, context });
      return id;
    }

    try {
      // Register through the shared listener backend used by EventManager.
      // This ensures a single low-level tracking mechanism while keeping EventBus
      // semantics (SubscriptionManager IDs, context grouping, AbortSignal cleanup).
      const managedId = addListenerManaged(element, type, listener, listenerOptions, context);

      // AbortSignal cleanup is wired via an event listener.
      // Ensure abort listeners are removed when the subscription is cleaned up
      // to avoid retaining closures for long-lived signals.
      let abortHandler: (() => void) | null = null;

      // Create subscription entry
      const subscription: Subscription = {
        id,
        type: 'dom',
        context,
        cleanup: () => {
          try {
            removeEventListenerManaged(managedId);
          } catch (error) {
            logger.warn(`[DOMEventManager] Failed to remove listener: ${type}`, error);
          }

          if (signal && abortHandler) {
            try {
              signal.removeEventListener('abort', abortHandler);
            } catch {
              // Ignore - some environments may not support removeEventListener on AbortSignal
            }
          }

          abortHandler = null;
        },
      };

      // Store subscription
      this.subscriptionManager.add(subscription);

      // Wire up AbortSignal for automatic cleanup
      if (signal) {
        abortHandler = () => {
          this.subscriptionManager.remove(id);
        };

        signal.addEventListener('abort', abortHandler, { once: true });
      }

      logger.debug(`[DOMEventManager] DOM listener added: ${type} (${id})`, { context });
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
  listener: EventListener,
  options: DOMListenerOptions,
  subscriptionManager: SubscriptionManager
): string {
  const manager = new DOMEventManager(subscriptionManager);
  return manager.addListener(element, type, listener, options);
}
