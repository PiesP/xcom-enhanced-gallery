/**
 * @fileoverview Unified Event Bus
 * @version 1.0.0
 *
 * Provides a centralized event management system that unifies:
 * - DOM event listeners (managed by listener-manager)
 * - Application events (type-safe emitter pattern)
 * - AbortController-based subscription management
 *
 * **Design Goals**:
 * - Single source of truth for all event subscriptions
 * - AbortController/AbortSignal for automatic cleanup
 * - Type-safe application event emission
 * - Context-based grouping for batch operations
 * - Memory-leak prevention via automatic cleanup
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

// ============================================================================
// Types
// ============================================================================

/**
 * Application event map - extend this interface to add custom events
 */
export interface AppEventMap {
  /** Navigation index changed */
  'navigation:change': { index: number; total: number };
  /** Gallery opened */
  'gallery:open': { mediaCount: number };
  /** Gallery closed */
  'gallery:close': { reason: 'escape' | 'click' | 'navigation' };
  /** Download started */
  'download:start': { url: string; filename: string };
  /** Download completed */
  'download:complete': { url: string; success: boolean };
  /** Theme changed */
  'theme:change': { theme: 'light' | 'dark'; source: 'user' | 'system' };
  /** Settings changed */
  'settings:change': { key: string; value: unknown };
}

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
 * Application event subscription options
 */
export interface AppEventOptions {
  /** AbortSignal for automatic cleanup */
  signal?: AbortSignal;
  /** Execute only once then auto-unsubscribe */
  once?: boolean;
}

/**
 * Internal subscription entry
 */
interface Subscription {
  id: string;
  type: 'dom' | 'app';
  context?: string | undefined;
  cleanup: () => void;
}

// ============================================================================
// Implementation
// ============================================================================

/**
 * Unified Event Bus
 *
 * Centralizes all event management with:
 * - DOM event listener tracking
 * - Type-safe application events
 * - AbortController-based automatic cleanup
 * - Context-based batch operations
 */
export class EventBus {
  private readonly lifecycle: Lifecycle;
  private static readonly singleton = createSingleton(() => new EventBus());

  /** All active subscriptions indexed by ID */
  private readonly subscriptions = new Map<string, Subscription>();

  /** Application event listeners */
  private readonly appListeners = new Map<keyof AppEventMap, Set<(data: unknown) => void>>();

  /** ID counter for unique subscription IDs */
  private idCounter = 0;

  private constructor() {
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
    EventBus.singleton.reset();
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
  // DOM Event Management
  // ==========================================================================

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
   * const id = eventBus.addDOMListener(
   *   document,
   *   'keydown',
   *   (e) => console.log(e.key),
   *   { signal: controller.signal, context: 'keyboard' }
   * );
   *
   * // Auto-cleanup on abort
   * controller.abort();
   *
   * // Or manual removal
   * eventBus.remove(id);
   * ```
   */
  public addDOMListener(
    element: EventTarget,
    type: string,
    listener: EventListener,
    options: DOMListenerOptions = {},
  ): string {
    const { signal, context, ...listenerOptions } = options;
    const id = this.generateId('dom', context);

    // Check if already aborted
    if (signal?.aborted) {
      logger.debug(`[EventBus] Skipping aborted listener: ${type}`);
      return id;
    }

    // Validate element
    if (!element || typeof element.addEventListener !== 'function') {
      logger.warn('[EventBus] Invalid element for DOM listener', { type, context });
      return id;
    }

    try {
      // Add the actual DOM listener
      element.addEventListener(type, listener, listenerOptions);

      // Create cleanup function
      const cleanup = () => {
        try {
          element.removeEventListener(type, listener, listenerOptions);
        } catch (error) {
          logger.warn(`[EventBus] Failed to remove listener: ${type}`, error);
        }
        this.subscriptions.delete(id);
      };

      // Store subscription
      this.subscriptions.set(id, {
        id,
        type: 'dom',
        context,
        cleanup,
      });

      // Wire up AbortSignal for automatic cleanup
      if (signal) {
        signal.addEventListener('abort', cleanup, { once: true });
      }

      logger.debug(`[EventBus] DOM listener added: ${type} (${id})`, { context });
      return id;
    } catch (error) {
      logger.error(`[EventBus] Failed to add listener: ${type}`, error);
      return id;
    }
  }

  // ==========================================================================
  // Application Event Management
  // ==========================================================================

  /**
   * Subscribe to an application event
   *
   * @param event - Event name from AppEventMap
   * @param callback - Handler function
   * @param options - Subscription options including AbortSignal
   * @returns Unsubscribe function
   *
   * @example
   * ```typescript
   * const controller = new AbortController();
   *
   * const unsubscribe = eventBus.on('navigation:change', ({ index, total }) => {
   *   console.log(`Navigated to ${index + 1}/${total}`);
   * }, { signal: controller.signal });
   *
   * // Manual unsubscribe
   * unsubscribe();
   *
   * // Or automatic cleanup via abort
   * controller.abort();
   * ```
   */
  public on<K extends keyof AppEventMap>(
    event: K,
    callback: (data: AppEventMap[K]) => void,
    options: AppEventOptions = {},
  ): () => void {
    const { signal, once = false } = options;
    const id = this.generateId('app', event as string);

    // Check if already aborted
    if (signal?.aborted) {
      return () => {};
    }

    // Get or create listener set for this event
    if (!this.appListeners.has(event)) {
      this.appListeners.set(event, new Set());
    }

    const listeners = this.appListeners.get(event)!;

    // Wrap callback for once behavior
    const wrappedCallback = once
      ? (data: unknown) => {
          callback(data as AppEventMap[K]);
          cleanup();
        }
      : (data: unknown) => {
          callback(data as AppEventMap[K]);
        };

    // Add to listener set
    listeners.add(wrappedCallback);

    // Create cleanup function
    const cleanup = () => {
      listeners.delete(wrappedCallback);
      this.subscriptions.delete(id);
    };

    // Store subscription
    this.subscriptions.set(id, {
      id,
      type: 'app',
      context: event as string,
      cleanup,
    });

    // Wire up AbortSignal
    if (signal) {
      signal.addEventListener('abort', cleanup, { once: true });
    }

    logger.debug(`[EventBus] App listener added: ${String(event)} (${id})`);
    return cleanup;
  }

  /**
   * Subscribe to an application event (one-time)
   */
  public once<K extends keyof AppEventMap>(
    event: K,
    callback: (data: AppEventMap[K]) => void,
    options: Omit<AppEventOptions, 'once'> = {},
  ): () => void {
    return this.on(event, callback, { ...options, once: true });
  }

  /**
   * Emit an application event
   *
   * @param event - Event name from AppEventMap
   * @param data - Event payload
   *
   * @example
   * ```typescript
   * eventBus.emit('navigation:change', { index: 5, total: 10 });
   * eventBus.emit('gallery:close', { reason: 'escape' });
   * ```
   */
  public emit<K extends keyof AppEventMap>(event: K, data: AppEventMap[K]): void {
    const listeners = this.appListeners.get(event);

    if (!listeners || listeners.size === 0) {
      return;
    }

    logger.debug(`[EventBus] Emitting: ${String(event)}`, data);

    // Execute all listeners with error isolation
    listeners.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        logger.error(`[EventBus] Listener error for "${String(event)}":`, error);
      }
    });
  }

  // ==========================================================================
  // Subscription Management
  // ==========================================================================

  /**
   * Remove a subscription by ID
   */
  public remove(id: string): boolean {
    const subscription = this.subscriptions.get(id);
    if (!subscription) {
      return false;
    }

    subscription.cleanup();
    return true;
  }

  /**
   * Remove all subscriptions matching a context
   *
   * @param context - Context string to match
   * @returns Number of removed subscriptions
   */
  public removeByContext(context: string): number {
    const toRemove: string[] = [];

    for (const [id, sub] of this.subscriptions) {
      if (sub.context === context) {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.remove(id);
    }

    if (toRemove.length > 0) {
      logger.debug(`[EventBus] Removed ${toRemove.length} subscriptions for context: ${context}`);
    }

    return toRemove.length;
  }

  /**
   * Remove all subscriptions
   */
  public removeAll(): void {
    const count = this.subscriptions.size;

    for (const subscription of this.subscriptions.values()) {
      subscription.cleanup();
    }

    this.subscriptions.clear();
    this.appListeners.clear();

    if (count > 0) {
      logger.debug(`[EventBus] Removed all ${count} subscriptions`);
    }
  }

  /**
   * Get subscription statistics
   */
  public getStats(): {
    total: number;
    dom: number;
    app: number;
    byContext: Record<string, number>;
  } {
    const stats = {
      total: this.subscriptions.size,
      dom: 0,
      app: 0,
      byContext: {} as Record<string, number>,
    };

    for (const sub of this.subscriptions.values()) {
      if (sub.type === 'dom') {
        stats.dom++;
      } else {
        stats.app++;
      }

      if (sub.context) {
        stats.byContext[sub.context] = (stats.byContext[sub.context] || 0) + 1;
      }
    }

    return stats;
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
      { once: true },
    );

    return controller;
  }

  private generateId(type: string, context?: string): string {
    const id = `${type}:${++this.idCounter}`;
    return context ? `${context}:${id}` : id;
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

/**
 * Type-safe event emitter factory (legacy compatibility)
 *
 * @deprecated Use EventBus.on/emit directly for new code
 */
export function createTypedEventEmitter<T extends Record<string, unknown>>(): {
  on: <K extends keyof T>(event: K, callback: (data: T[K]) => void) => () => void;
  emit: <K extends keyof T>(event: K, data: T[K]) => void;
  dispose: () => void;
} {
  const listeners = new Map<keyof T, Set<(data: unknown) => void>>();

  return {
    on<K extends keyof T>(event: K, callback: (data: T[K]) => void): () => void {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event)!.add(callback as (data: unknown) => void);
      return () => listeners.get(event)?.delete(callback as (data: unknown) => void);
    },

    emit<K extends keyof T>(event: K, data: T[K]): void {
      listeners.get(event)?.forEach((cb) => {
        try {
          cb(data);
        } catch (error) {
          logger.error('[TypedEventEmitter] Listener error:', error);
        }
      });
    },

    dispose(): void {
      listeners.clear();
    },
  };
}
