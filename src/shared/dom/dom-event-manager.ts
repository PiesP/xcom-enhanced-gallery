/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview DOM Event Manager - Type-Safe Event Registration & Cleanup
 * @version 2.1.0 - Phase 195: Structural optimization, Phase 403: Enhanced docs
 *
 * Provides safe event listener registration with automatic cleanup tracking.
 * Chainable API for ergonomic multiple event registration.
 *
 * **Design Pattern**: Builder pattern (chainable), cleanup-tracker
 * **Architecture Role**: Internal utility for event management (not exported from index.ts)
 * **Key Features**:
 * - ✅ Automatic cleanup tracking (cleanup() removes all listeners)
 * - ✅ Type-safe event registration (HTMLElement events, custom events)
 * - ✅ Chainable API (addEventListener returns this)
 * - ✅ Error resilient (errors logged, not thrown)
 * - ✅ Null-tolerant (null elements safely ignored)
 *
 * **Lifecycle**:
 * ```
 * const manager = new DomEventManager();
 * manager
 *   .addEventListener(btn, 'click', handler1)
 *   .addEventListener(doc, 'scroll', handler2)
 *   .cleanup(); // Removes all listeners + marks destroyed
 * ```
 *
 * **Access**:
 * ❌ NOT in: index.ts (internal only)
 * ✅ Use: Direct relative import or helpers from @shared/utils/browser
 *
 * **Vitest Note**: Relative imports used (Windows alias resolution workaround)
 *
 * @related [DOM Utils](./utils/dom-utils.ts), [DomCache](./dom-cache.ts)
 */

// NOTE: Vitest Windows alias resolution workaround — internal dependencies use relative paths
import { logger } from '@shared/logging';
import {
  addListener,
  removeEventListenerManaged,
} from '@shared/utils/events/core/listener-manager';

// ============================================================================
// Types & Interfaces
// ============================================================================

/** Cleanup function type (removes a specific event listener) */
type EventCleanup = () => void;

/**
 * Standard DOM event listener options.
 *
 * **Options**:
 * - passive: Cannot call preventDefault() (scroll optimization)
 * - capture: Use capture phase instead of bubble phase
 * - once: Automatically remove after first trigger
 */
interface EventOptions {
  passive?: boolean;
  capture?: boolean;
  once?: boolean;
}

// ============================================================================
// DomEventManager Class
// ============================================================================

/**
 * DOM event registration with automatic cleanup tracking.
 *
 * **Lifecycle**:
 * 1. Create: `new DomEventManager()`
 * 2. Register: `addEventListener()` / `addCustomEventListener()` (chainable)
 * 3. Cleanup: `cleanup()` (removes all listeners, marks destroyed)
 *
 * **Key Methods**:
 * - addEventListener() - Type-safe HTMLElement events
 * - addCustomEventListener() - Custom/unknown event types
 * - cleanup() - Remove all listeners + disable further operations
 * - getListenerCount() - Diagnostics
 * - getIsDestroyed() - Lifecycle state check
 *
 * **Error Handling**: All errors logged, never thrown
 */
export class DomEventManager {
  private cleanups: EventCleanup[] = [];
  private isDestroyed = false;

  /**
   * Register HTML element event listener (type-safe).
   *
   * **Type Safety**: K extends keyof HTMLElementEventMap (compile-time validation)
   * **Cleanup**: Automatically tracked for removal on cleanup()
   * **Null Tolerance**: No-op if element null or manager destroyed
   * **Chainable**: Returns this for method chaining
   *
   * @template K - HTML event type (e.g., 'click', 'scroll')
   * @param element - Target element (null tolerance)
   * @param eventType - Event type from HTMLElementEventMap
   * @param handler - Event handler function (strongly typed)
   * @param options - addEventListener options
   * @returns this (for chaining)
   *
   * @example
   * manager
   *   .addEventListener(button, 'click', handleClick)
   *   .addEventListener(window, 'scroll', handleScroll);
   */
  public addEventListener<K extends keyof HTMLElementEventMap>(
    element: HTMLElement | Document | Window | null,
    eventType: K,
    handler: (event: HTMLElementEventMap[K]) => void,
    options?: EventOptions,
  ): DomEventManager {
    if (!element || this.isDestroyed) {
      return this;
    }

    try {
      const id = addListener(
        element,
        eventType,
        handler as EventListener,
        options,
        'DomEventManager',
      );

      this.cleanups.push(() => {
        removeEventListenerManaged(id);
      });

      logger.debug('DOM EM: Event listener registered', {
        eventType,
        options,
        id,
      });
    } catch (error) {
      logger.error('DOM EM: Failed to register event listener', {
        eventType,
        error,
      });
    }

    return this;
  }

  /**
   * Register custom event listener (any event type).
   *
   * **Use Case**: Custom events, non-standard events, runtime event types
   * **Type Safety**: Lost for eventType (string parameter)
   * **Cleanup**: Automatically tracked for removal on cleanup()
   * **Null Tolerance**: No-op if element null or manager destroyed
   * **Chainable**: Returns this for method chaining
   *
   * @param element - Target element (null tolerance)
   * @param eventType - Custom event type (any string)
   * @param handler - Generic event handler
   * @param options - addEventListener options
   * @returns this (for chaining)
   *
   * @example
   * manager.addCustomEventListener(element, 'custom:event', (e) => {
   *   console.log(e);
   * });
   */
  public addCustomEventListener(
    element: HTMLElement | Document | Window | null,
    eventType: string,
    handler: (event: Event) => void,
    options?: EventOptions,
  ): DomEventManager {
    if (!element || this.isDestroyed) {
      return this;
    }

    try {
      const id = addListener(element, eventType, handler, options, 'DomEventManager:Custom');

      this.cleanups.push(() => {
        removeEventListenerManaged(id);
      });

      logger.debug('DOM EM: Custom event listener registered', {
        eventType,
        options,
        id,
      });
    } catch (error) {
      logger.error('DOM EM: Failed to register custom event listener', {
        eventType,
        error,
      });
    }

    return this;
  }

  /**
   * Remove all registered event listeners and mark destroyed.
   *
   * **Behavior**:
   * - Executes all tracked cleanup functions (reverse registration)
   * - Sets isDestroyed = true (subsequent operations no-op)
   * - Logs cleanup count and any errors
   * - Clears cleanups array
   *
   * **Idempotent**: Safe to call multiple times (no-op after first call)
   * **Error Handling**: Individual errors logged, cleanup continues
   *
   * @example
   * manager.cleanup(); // Removes all listeners, marks destroyed
   * manager.addEventListener(el, 'click', handler); // No-op, already destroyed
   */
  public cleanup(): void {
    if (this.isDestroyed) {
      return;
    }

    let cleanupCount = 0;
    this.cleanups.forEach((cleanup) => {
      try {
        cleanup();
        cleanupCount++;
      } catch (error) {
        logger.warn('DOM EM: Failed to cleanup individual listener', error);
      }
    });

    this.cleanups = [];
    this.isDestroyed = true;

    logger.debug('DOM EM: All event listeners cleanup completed', {
      cleanupCount,
    });
  }

  /**
   * Get count of registered event listeners (diagnostics).
   *
   * **Use Case**: Debugging, memory profiling, state inspection
   * **Note**: Counts cleanup functions (1 per listener)
   *
   * @returns Number of registered listeners (not yet cleaned up)
   */
  public getListenerCount(): number {
    return this.cleanups.length;
  }

  /**
   * Check if manager has been cleaned up.
   *
   * **Use Case**: Lifecycle verification before adding events
   * **Note**: After destroy, manager is unusable (all operations no-op)
   *
   * @returns true if cleanup() called, false otherwise
   */
  public getIsDestroyed(): boolean {
    return this.isDestroyed;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create new DOM event manager instance.
 *
 * **Convenience Factory**: Shorthand for `new DomEventManager()`
 * **Use Case**: Cleaner instantiation syntax
 *
 * @returns New independent event manager instance
 * @note EventManager (event-manager.ts) uses this internally
 *
 * @example
 * const manager = createDomEventManager();
 */
export function createDomEventManager(): DomEventManager {
  return new DomEventManager();
}
