/**
 * @fileoverview Type-safe Application Event Emitter
 * @version 1.0.0
 *
 * Provides type-safe application event emission and subscription.
 *
 * **Design Goals**:
 * - Type-safe event emission
 * - AbortSignal for automatic cleanup
 * - Once-behavior support
 * - Error isolation per listener
 * - Legacy emitter factory for compatibility
 */

import { logger } from '@shared/logging';
import type { Subscription, SubscriptionManager } from './event-context';

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
 * Application event subscription options
 */
export interface AppEventOptions {
  /** AbortSignal for automatic cleanup */
  signal?: AbortSignal;
  /** Execute only once then auto-unsubscribe */
  once?: boolean;
}

// ============================================================================
// Implementation
// ============================================================================

/**
 * Application Event Manager
 *
 * Manages type-safe application event emission and subscription.
 */
export class AppEventManager {
  /** Application event listeners */
  private readonly appListeners = new Map<keyof AppEventMap, Set<(data: unknown) => void>>();

  constructor(private readonly subscriptionManager: SubscriptionManager) {}

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
   * const unsubscribe = appEvents.on('navigation:change', ({ index, total }) => {
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
    const id = this.subscriptionManager.generateId('app', event as string);

    // Check if already aborted
    if (signal?.aborted) {
      return () => {};
    }

    // Get or create listener set for this event
    if (!this.appListeners.has(event)) {
      this.appListeners.set(event, new Set());
    }

    const listeners = this.appListeners.get(event)!;

    // Create cleanup function that removes from both listener set and subscription manager
    const cleanup = () => {
      if (wrappedCallback) {
        listeners.delete(wrappedCallback);
      }
      this.subscriptionManager.remove(id);
    };

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

    // Create subscription entry
    const subscription: Subscription = {
      id,
      type: 'app',
      context: event as string,
      cleanup: () => {
        listeners.delete(wrappedCallback);
      },
    };

    // Store subscription
    this.subscriptionManager.add(subscription);

    // Wire up AbortSignal
    if (signal) {
      signal.addEventListener('abort', cleanup, { once: true });
    }

    logger.debug(`[AppEventManager] App listener added: ${String(event)} (${id})`);
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
   * appEvents.emit('navigation:change', { index: 5, total: 10 });
   * appEvents.emit('gallery:close', { reason: 'escape' });
   * ```
   */
  public emit<K extends keyof AppEventMap>(event: K, data: AppEventMap[K]): void {
    const listeners = this.appListeners.get(event);

    if (!listeners || listeners.size === 0) {
      return;
    }

    logger.debug(`[AppEventManager] Emitting: ${String(event)}`, data);

    // Execute all listeners with error isolation
    listeners.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        logger.error(`[AppEventManager] Listener error for "${String(event)}":`, error);
      }
    });
  }

  /**
   * Clear all listeners (for cleanup)
   * @internal
   */
  public _clear(): void {
    this.appListeners.clear();
  }
}

// ============================================================================
// Legacy Compatibility
// ============================================================================

/**
 * Type-safe event emitter factory (legacy compatibility)
 *
 * @deprecated Use AppEventManager.on/emit directly for new code
 *
 * @example
 * ```typescript
 * interface MyEvents {
 *   'user:login': { userId: string };
 *   'user:logout': { reason: string };
 * }
 *
 * const emitter = createTypedEventEmitter<MyEvents>();
 * const unsubscribe = emitter.on('user:login', ({ userId }) => {
 *   console.log('User logged in:', userId);
 * });
 *
 * emitter.emit('user:login', { userId: '123' });
 * emitter.dispose();
 * ```
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
