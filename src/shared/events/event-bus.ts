/**
 * @fileoverview Unified Event Bus (Facade)
 * @version 2.0.0
 *
 * Provides a centralized event management system that delegates to specialized modules:
 * - DOM event listeners (dom-events.ts)
 * - Application events (app-events.ts)
 * - Subscription management (event-context.ts)
 *
 * **Design Goals**:
 * - Single source of truth for all event subscriptions
 * - AbortController/AbortSignal for automatic cleanup
 * - Type-safe application event emission
 * - Context-based grouping for batch operations
 * - Memory-leak prevention via automatic cleanup
 *
 * **Refactoring Notes**:
 * This file now acts as a facade maintaining backward compatibility.
 * New code can choose one of the following patterns:
 * - `EventBus` (recommended): unified DOM + app events
 * - `EventManager` (DOM only): `import { EventManager } from '@shared/services/event-manager'`
 * - `AppEventManager` (app events only): `import { AppEventManager } from '@shared/events/app-events'`
 *
 * @example
 * ```typescript
 * // DOM event with AbortController
 * const controller = new AbortController();
 * eventBus.addDOMListener(element, 'click', handler, {
 *   signal: controller.signal,
 *   context: 'gallery'
 * });
 *
 * // Application event
 * eventBus.on('navigation:change', ({ index }) => {
 *   console.log('Navigated to:', index);
 * }, { signal: controller.signal });
 *
 * // Cleanup all subscriptions
 * controller.abort();
 * ```
 */

import { logger } from '@shared/logging';
import type { Lifecycle } from '@shared/services/lifecycle';
import { createLifecycle } from '@shared/services/lifecycle';
import { createSingleton } from '@shared/utils/types/singleton';

// Import specialized modules
import { AppEventManager, type AppEventMap, type AppEventOptions } from './app-events';
import { DOMEventManager, type DOMListener, type DOMListenerOptions } from './dom-events';
import { SubscriptionManager, type SubscriptionStats } from './event-context';

// ============================================================================
// Re-exports for backward compatibility
// ============================================================================

export type { AppEventMap, AppEventOptions, DOMListenerOptions, SubscriptionStats };

// ============================================================================
// Unified Event Bus Implementation
// ============================================================================

/**
 * Unified Event Bus
 *
 * Facade that delegates to specialized modules while maintaining
 * backward compatibility with the existing API.
 */
export class EventBus {
  private readonly lifecycle: Lifecycle;
  private static readonly singleton = createSingleton(() => new EventBus());

  private readonly subscriptionManager: SubscriptionManager;
  private readonly domEventManager: DOMEventManager;
  private readonly appEventManager: AppEventManager;

  private constructor() {
    this.subscriptionManager = new SubscriptionManager();
    this.domEventManager = new DOMEventManager(this.subscriptionManager);
    this.appEventManager = new AppEventManager(this.subscriptionManager);

    this.lifecycle = createLifecycle('EventBus', {
      onInitialize: () => this.onInitialize(),
      onDestroy: () => this.onDestroy(),
    });
  }

  /** Get singleton instance */
  public static getInstance(): EventBus {
    return EventBus.singleton.get();
  }

  /** @internal Test helper */
  public static resetForTests(): void {
    const instance = EventBus.singleton.get();
    instance.removeAll();
    EventBus.singleton.reset?.();
  }

  /** Initialize service */
  public async initialize(): Promise<void> {
    return this.lifecycle.initialize();
  }

  /** Destroy service */
  public destroy(): void {
    this.lifecycle.destroy();
  }

  /** Check if initialized */
  public isInitialized(): boolean {
    return this.lifecycle.isInitialized();
  }

  private async onInitialize(): Promise<void> {
    logger.debug('[EventBus] Initialized');
  }

  private onDestroy(): void {
    this.removeAll();
    logger.debug('[EventBus] Destroyed');
  }

  // ==========================================================================
  // DOM Event Management (delegates to DOMEventManager)
  // ==========================================================================

  /**
   * Add DOM event listener with automatic cleanup support
   *
   * @param element - Target DOM element
   * @param type - Event type (e.g., 'click', 'keydown')
   * @param listener - Event handler function
   * @param options - Listener options including AbortSignal
   * @returns Subscription ID for manual removal
   */
  public addDOMListener<E extends Event = Event>(
    element: EventTarget,
    type: string,
    listener: DOMListener<E>,
    options: DOMListenerOptions = {}
  ): string {
    return this.domEventManager.addListener(element, type, listener, options);
  }

  // ==========================================================================
  // Application Event Management (delegates to AppEventManager)
  // ==========================================================================

  /**
   * Subscribe to an application event
   *
   * @param event - Event name from AppEventMap
   * @param callback - Handler function
   * @param options - Subscription options including AbortSignal
   * @returns Unsubscribe function
   */
  public on<K extends keyof AppEventMap>(
    event: K,
    callback: (data: AppEventMap[K]) => void,
    options: AppEventOptions = {}
  ): () => void {
    return this.appEventManager.on(event, callback, options);
  }

  /**
   * Subscribe to an application event (one-time)
   */
  public once<K extends keyof AppEventMap>(
    event: K,
    callback: (data: AppEventMap[K]) => void,
    options: Omit<AppEventOptions, 'once'> = {}
  ): () => void {
    return this.appEventManager.once(event, callback, options);
  }

  /**
   * Emit an application event
   *
   * @param event - Event name from AppEventMap
   * @param data - Event payload
   */
  public emit<K extends keyof AppEventMap>(event: K, data: AppEventMap[K]): void {
    this.appEventManager.emit(event, data);
  }

  // ==========================================================================
  // Subscription Management (delegates to SubscriptionManager)
  // ==========================================================================

  /**
   * Remove a subscription by ID
   */
  public remove(id: string): boolean {
    return this.subscriptionManager.remove(id);
  }

  /**
   * Remove all subscriptions matching a context
   *
   * @param context - Context string to match
   * @returns Number of removed subscriptions
   */
  public removeByContext(context: string): number {
    return this.subscriptionManager.removeByContext(context);
  }

  /**
   * Remove all subscriptions
   */
  public removeAll(): void {
    this.subscriptionManager.removeAll();
    this.appEventManager._clear();
  }

  /**
   * Get subscription statistics
   */
  public getStats(): SubscriptionStats {
    return this.subscriptionManager.getStats();
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  /**
   * Create an AbortController scoped to a context
   *
   * When the controller is aborted, all subscriptions with the given
   * context will be automatically cleaned up.
   *
   * @param context - Context name for the controller
   * @returns AbortController that also removes by context on abort
   */
  public createScopedController(context: string): AbortController {
    const controller = new AbortController();

    controller.signal.addEventListener(
      'abort',
      () => {
        this.removeByContext(context);
      },
      { once: true }
    );

    return controller;
  }
}

// ============================================================================
// Convenience Exports
// ============================================================================

/**
 * Get EventBus singleton instance
 */
export function getEventBus(): EventBus {
  return EventBus.getInstance();
}
