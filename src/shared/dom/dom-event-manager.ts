/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview DOM Event Manager - Type-Safe Event Registration & Cleanup
 * @version 3.0.0 - Phase 600: Deprecated - functionality moved to EventManager
 *
 * @deprecated Phase 600: Use EventManager from @shared/services/event-manager directly.
 *             This file is kept for backward compatibility only.
 *             The DomEventManager class is still exported for existing code that depends on it,
 *             but new code should use EventManager.getInstance() instead.
 *
 * Migration Guide:
 * ```typescript
 * // Before (deprecated)
 * import { createDomEventManager, DomEventManager } from '@shared/dom/dom-event-manager';
 * const manager = createDomEventManager();
 * manager.addEventListener(element, 'click', handler);
 *
 * // After (recommended)
 * import { EventManager } from '@shared/services/event-manager';
 * const eventManager = EventManager.getInstance();
 * eventManager.addEventListener(element, 'click', handler);
 * ```
 */

import { logger } from '@/shared/logging';
import { EventManager } from '@/shared/services/event-manager';
import { removeEventListenerManaged } from '@/shared/utils/events/core/listener-manager';

// ============================================================================
// Types & Interfaces
// ============================================================================

/** Cleanup function type (removes a specific event listener) */
type EventCleanup = () => void;

/**
 * Standard DOM event listener options.
 */
interface EventOptions {
  passive?: boolean;
  capture?: boolean;
  once?: boolean;
}

// ============================================================================
// DomEventManager Class (Deprecated - kept for backward compatibility)
// ============================================================================

/**
 * @deprecated Phase 600: Use EventManager.getInstance() from @shared/services/event-manager.
 *
 * DOM event registration with automatic cleanup tracking.
 * This class is kept for backward compatibility only.
 */
export class DomEventManager {
  private cleanups: EventCleanup[] = [];
  private isDestroyed = false;

  /**
   * @deprecated Use EventManager.getInstance().addEventListener() instead.
   *
   * Register HTML element event listener (type-safe).
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
      const id = EventManager.getInstance().addListener(
        element,
        eventType,
        handler as EventListener,
        options,
        'DomEventManager',
      );

      this.cleanups.push(() => {
        // Prefer EventManager removal API for consistency; fall back to low-level removal
        try {
          EventManager.getInstance().removeListener(id);
        } catch (error) {
          logger.warn(
            'DOM EM: EventManager.removeListener failed - falling back to low-level removal',
            error
          );
          removeEventListenerManaged(id);
        }
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
   * @deprecated Use EventManager.getInstance().addCustomEventListener() instead.
   *
   * Register custom event listener (any event type).
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
      const id = EventManager.getInstance().addListener(
        element,
        eventType,
        handler,
        options,
        'DomEventManager:Custom',
      );

      this.cleanups.push(() => {
        // Use EventManager removal API to ensure consistent cleanup behavior, but
        // fall back to calling removeEventListenerManaged directly if needed.
        try {
          EventManager.getInstance().removeListener(id);
        } catch (error) {
          logger.warn('DOM EM: EventManager.removeListener failed - falling back to low-level removal', error);
          // Ensure we still attempt cleanup via the low-level API if EventManager removal fails
          removeEventListenerManaged(id);
        }
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
   * @deprecated Use EventManager.getInstance().cleanup() instead.
   *
   * Remove all registered event listeners and mark destroyed.
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
   */
  public getListenerCount(): number {
    return this.cleanups.length;
  }

  /**
   * Check if manager has been cleaned up.
   */
  public getIsDestroyed(): boolean {
    return this.isDestroyed;
  }
}

// ============================================================================
// Factory Function (Deprecated)
// ============================================================================

/**
 * @deprecated Phase 600: Use EventManager.getInstance() from @shared/services/event-manager.
 *
 * Create new DOM event manager instance.
 * This function is kept for backward compatibility only.
 */
export function createDomEventManager(): DomEventManager {
  return new DomEventManager();
}
