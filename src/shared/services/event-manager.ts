/**
 * @fileoverview Unified Event Manager (BaseServiceImpl pattern applied)
 * @description Single interface integrating DOM events and events utility.
 *              Phase 600: DomEventManager functionality integrated directly.
 * @version 3.0.0 - Unified event management with reduced abstraction layers
 */

import { logger } from '@/shared/logging';
import type { EventHandlers, GalleryEventOptions } from '@/shared/utils/events/core/event-context';
import {
  addListener as registerManagedListener,
  getEventListenerStatus,
  removeEventListenerManaged,
  removeEventListenersByContext,
} from '@/shared/utils/events/core/listener-manager';
import {
  cleanupGalleryEvents,
  getGalleryEventSnapshot,
  initializeGalleryEvents,
} from '@/shared/utils/events/lifecycle/gallery-lifecycle';
import { BaseServiceImpl } from './base-service';

/**
 * Standard DOM event listener options.
 */
interface EventOptions {
  passive?: boolean;
  capture?: boolean;
  once?: boolean;
  signal?: AbortSignal;
}

/**
 * Unified Event Manager
 * Combines DOM event management and Gallery event lifecycle.
 * Phase 600: DomEventManager functionality integrated directly.
 *
 * **Design Pattern**: Singleton + Builder (chainable API)
 * **Key Features**:
 * - ✅ Automatic cleanup tracking
 * - ✅ Type-safe event registration
 * - ✅ Chainable API
 * - ✅ Context-based listener grouping
 * - ✅ Gallery lifecycle management
 */
export class EventManager extends BaseServiceImpl {
  private static instance: EventManager | null = null;
  private isDestroyed = false;

  private static readonly DOM_EVENT_CONTEXT = 'EventManager:DOM';
  private static readonly CUSTOM_EVENT_CONTEXT = 'EventManager:Custom';

  private constructor() {
    super('EventManager');
  }

  /**
   * Singleton instance return
   */
  public static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }

  /**
   * Lifecycle: Initialization
   */
  protected async onInitialize(): Promise<void> {
    logger.debug('EventManager initialization completed');
  }

  /**
   * Lifecycle: Cleanup
   */
  protected onDestroy(): void {
    this.cleanup();
    logger.debug('EventManager destroyed');
  }

  // ================================
  // DOM Event Management (integrated from DomEventManager)
  // ================================

  /**
   * Register HTML element event listener (type-safe).
   * Chainable API for ergonomic multiple event registration.
   *
   * @template K - HTML event type (e.g., 'click', 'scroll')
   * @param element - Target element (null tolerance)
   * @param eventType - Event type from HTMLElementEventMap
   * @param handler - Event handler function (strongly typed)
   * @param options - addEventListener options
   * @returns this (for chaining)
   */
  public addEventListener<K extends keyof HTMLElementEventMap>(
    element: HTMLElement | Document | Window | null,
    eventType: K,
    handler: (event: HTMLElementEventMap[K]) => void,
    options?: EventOptions
  ): EventManager {
    if (!element || this.isDestroyed) {
      if (this.isDestroyed) {
        logger.warn('addEventListener called on destroyed EventManager');
      }
      return this;
    }

    try {
      const id = registerManagedListener(
        element,
        eventType,
        handler as EventListener,
        options,
        EventManager.DOM_EVENT_CONTEXT
      );

      logger.debug('EventManager: DOM event listener registered', {
        eventType,
        options,
        id,
      });
    } catch (error) {
      logger.error('EventManager: Failed to register DOM event listener', {
        eventType,
        error,
      });
    }

    return this;
  }

  /**
   * Register custom event listener (any event type).
   * Use for custom events or non-standard event types.
   *
   * @param element - Target element (null tolerance)
   * @param eventType - Custom event type (any string)
   * @param handler - Generic event handler
   * @param options - addEventListener options
   * @returns this (for chaining)
   */
  public addCustomEventListener(
    element: HTMLElement | Document | Window | null,
    eventType: string,
    handler: (event: Event) => void,
    options?: EventOptions
  ): EventManager {
    if (!element || this.isDestroyed) {
      if (this.isDestroyed) {
        logger.warn('addCustomEventListener called on destroyed EventManager');
      }
      return this;
    }

    try {
      const id = registerManagedListener(
        element,
        eventType,
        handler,
        options,
        EventManager.CUSTOM_EVENT_CONTEXT
      );

      logger.debug('EventManager: Custom event listener registered', {
        eventType,
        options,
        id,
      });
    } catch (error) {
      logger.error('EventManager: Failed to register custom event listener', {
        eventType,
        error,
      });
    }

    return this;
  }

  /**
   * Get DOM event listener count (from cleanup tracking)
   */
  public getListenerCount(): number {
    const status = getEventListenerStatus();
    const byContext = status.byContext || {};
    return (
      (byContext[EventManager.DOM_EVENT_CONTEXT] || 0) +
      (byContext[EventManager.CUSTOM_EVENT_CONTEXT] || 0)
    );
  }

  /**
   * Check if destroyed
   */
  public getIsDestroyed(): boolean {
    return this.isDestroyed;
  }

  /**
   * Clean up all DOM events tracked by this manager
   */
  public cleanup(): void {
    if (this.isDestroyed) {
      return;
    }

    const domCount = removeEventListenersByContext(EventManager.DOM_EVENT_CONTEXT);
    const customCount = removeEventListenersByContext(EventManager.CUSTOM_EVENT_CONTEXT);

    this.isDestroyed = true;

    logger.debug('EventManager: DOM events cleanup completed', {
      cleanupCount: domCount + customCount,
      domCount,
      customCount,
    });
  }

  // ================================
  // Managed Listener Pattern (with context grouping)
  // ================================

  /**
   * Add event listener with ID tracking (managed pattern).
   * Supports context-based grouping for batch removal.
   *
   * @param element - Target element
   * @param type - Event type
   * @param listener - Event handler
   * @param options - Listener options
   * @param context - Context for grouping (e.g., 'gallery-keyboard')
   * @returns Listener ID for individual removal
   */
  public addListener(
    element: EventTarget,
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions,
    context?: string
  ): string {
    if (this.isDestroyed) {
      logger.warn('EventManager: addListener called on destroyed instance');
      return '';
    }

    return registerManagedListener(element, type, listener, options, context);
  }

  /**
   * Remove event listener by ID
   */
  public removeListener(id: string): boolean {
    return removeEventListenerManaged(id);
  }

  /**
   * Remove all event listeners by context
   */
  public removeByContext(context: string): number {
    return removeEventListenersByContext(context);
  }

  // ================================
  // Gallery Event Lifecycle
  // ================================

  /**
   * Initialize gallery events
   * Returns cleanup function for lifecycle management
   */
  public async initializeGallery(
    handlers: EventHandlers,
    options?: Partial<GalleryEventOptions>
  ): Promise<() => void> {
    return initializeGalleryEvents(handlers, options);
  }

  /**
   * Clean up gallery events
   */
  public cleanupGallery(): void {
    cleanupGalleryEvents();
  }

  /**
   * Get gallery event status
   */
  public getGalleryStatus() {
    return getGalleryEventSnapshot();
  }

  // ================================
  // Twitter-specific Events
  // ================================

  /**
   * Handle Twitter events (convenience method with context)
   */
  public handleTwitterEvent(
    element: EventTarget,
    eventType: string,
    handler: EventListener,
    context?: string
  ): string {
    if (this.isDestroyed) {
      logger.warn('handleTwitterEvent called on destroyed EventManager');
      return '';
    }

    return registerManagedListener(element, eventType, handler, undefined, context);
  }

  // ================================
  // Unified Status & Cleanup
  // ================================

  /**
   * Get unified status of all event systems
   */
  public getUnifiedStatus() {
    return {
      domEvents: {
        listenerCount: this.getListenerCount(),
        isDestroyed: this.isDestroyed,
      },
      galleryEvents: getGalleryEventSnapshot(),
      totalListeners: this.getListenerCount(),
      isDestroyed: this.getIsDestroyed(),
    };
  }

  /**
   * Clean up all events (DOM + Gallery)
   */
  public cleanupAll(): void {
    try {
      this.cleanupGallery();
    } catch (error) {
      logger.warn('EventManager: Failed to cleanup gallery events', error);
    }
    if (!this.isDestroyed) {
      this.cleanup();
    }
    logger.debug('EventManager complete cleanup');
  }
}
