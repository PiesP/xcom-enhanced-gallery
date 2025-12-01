/**
 * @fileoverview Unified Event Manager (BaseServiceImpl pattern applied)
 * @description Single interface integrating DOM Event Manager and events utility
 */

// NOTE: Vitest (vite-node) Windows alias resolution workaround — use relative paths for internal dependencies
import type { DomEventManager } from '@/shared/dom/dom-event-manager';
import { createDomEventManager } from '@/shared/dom/dom-event-manager';
import { logger } from '@/shared/logging';
import type { EventHandlers, GalleryEventOptions } from '@/shared/utils/events/core/event-context';
import {
  addListener as registerManagedListener,
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
 * Event Manager
 * Integrated functionality of DOM Event Manager and GalleryEventManager
 */
export class EventManager extends BaseServiceImpl {
  private static instance: EventManager | null = null;
  private readonly domManager: DomEventManager;
  private isDestroyed = false;

  private constructor() {
    super('EventManager');
    this.domManager = createDomEventManager();
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
    // DOM manager already initialized in constructor
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
  // DOM Event Manager delegation methods
  // ================================

  /**
   * Register DOM event listener
   */
  public addEventListener<K extends keyof HTMLElementEventMap>(
    element: HTMLElement | Document | Window | null,
    eventType: K,
    handler: (event: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions
  ): EventManager {
    if (this.isDestroyed) {
      logger.warn('addEventListener called on destroyed EventManager');
      return this;
    }

    this.domManager.addEventListener(element, eventType, handler, options);
    return this;
  }

  /**
   * Register custom event listener
   */
  public addCustomEventListener(
    element: HTMLElement | Document | Window | null,
    eventType: string,
    handler: (event: Event) => void,
    options?: AddEventListenerOptions
  ): EventManager {
    if (this.isDestroyed) {
      logger.warn('addCustomEventListener called on destroyed EventManager');
      return this;
    }

    this.domManager.addCustomEventListener(element, eventType, handler, options);
    return this;
  }

  /**
   * Get DOM event listener count
   */
  public getListenerCount(): number {
    return this.domManager.getListenerCount();
  }

  /**
   * Check if destroyed
   */
  public getIsDestroyed(): boolean {
    return this.isDestroyed || this.domManager.getIsDestroyed();
  }

  /**
   * Clean up DOM events
   */
  public cleanup(): void {
    this.isDestroyed = true;
    this.domManager.cleanup();
    logger.debug('EventManager DOM events cleanup completed');
  }

  // ================================
  // GalleryEventManager delegation methods
  // ================================

  /**
   * Add event listener (GalleryEventManager pattern)
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
   * Remove event listener
   */
  public removeListener(id: string): boolean {
    return removeEventListenerManaged(id);
  }

  /**
   * Remove event listeners by context
   */
  public removeByContext(context: string): number {
    return removeEventListenersByContext(context);
  }

  /**
   * Initialize gallery events
   * Phase 305: Returns cleanup function
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
   * Get gallery status
   */
  public getGalleryStatus() {
    return getGalleryEventSnapshot();
  }

  // ================================
  // Integrated functionality
  // ================================

  /**
   * Handle Twitter events (alias for handleTwitterEvent)
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

  /**
   * Get unified status
   */
  public getUnifiedStatus() {
    return {
      domEvents: {
        listenerCount: this.getListenerCount(),
        isDestroyed: this.domManager.getIsDestroyed(),
      },
      galleryEvents: getGalleryEventSnapshot(),
      totalListeners: this.getListenerCount(),
      isDestroyed: this.getIsDestroyed(),
    };
  }

  /**
   * Clean up all events
   */
  public cleanupAll(): void {
    this.cleanupGallery();
    if (!this.isDestroyed) {
      this.cleanup();
    }
    logger.debug('EventManager complete cleanup');
  }
}

// Aliases removed: external surface maintains only EventManager single interface
