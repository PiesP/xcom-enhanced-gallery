/**
 * @fileoverview Event Manager — singleton facade over the low-level listener manager.
 * Provides context-based cleanup and lifecycle integration.
 */

import { logger } from '@shared/logging/logger';
import type { Lifecycle } from '@shared/services/lifecycle';
import { createLifecycle } from '@shared/services/lifecycle';
import {
  getEventListenerStatus,
  addListener as registerManagedListener,
  removeEventListenerManaged,
} from '@shared/utils/events/core/listener-manager';
import { createSingleton } from '@shared/utils/types/singleton';

/**
 * Singleton EventManager with context-based listener grouping.
 */
export class EventManager {
  private readonly lifecycle: Lifecycle;
  private static readonly singleton = createSingleton(() => new EventManager());
  private isDestroyed = false;

  // Only tracks listeners registered through this instance so cleanup() does
  // not accidentally remove listeners owned by unrelated code paths that share
  // the underlying listener manager.
  private readonly ownedListenerContexts = new Map<string, string | undefined>();

  private constructor() {
    this.lifecycle = createLifecycle('EventManager', {
      onInitialize: () => this.onInitialize(),
      onDestroy: () => this.onDestroy(),
    });
  }

  /** Get singleton instance */
  public static getInstance(): EventManager {
    return EventManager.singleton.get();
  }

  /** @internal Test helper */
  public static resetForTests(): void {
    const existing = EventManager.singleton.peek?.();
    // The lifecycle destroy() hook is a no-op unless the instance was initialized.
    // In tests we may register listeners without calling initialize(), so ensure
    // we always perform cleanup.
    existing?.cleanup();
    existing?.destroy();
    EventManager.singleton.reset?.();
  }

  /** Initialize service (idempotent, fail-fast on error) */
  public async initialize(): Promise<void> {
    return this.lifecycle.initialize();
  }

  /** Destroy service (idempotent, graceful on error) */
  public destroy(): void {
    this.lifecycle.destroy();
  }

  /** Check if service is initialized */
  public isInitialized(): boolean {
    return this.lifecycle.isInitialized();
  }

  /** Lifecycle: Initialization */
  private async onInitialize(): Promise<void> {
    // Allow re-initialization after destroy().
    // The lifecycle helper supports initialize() after destroy(); ensure the
    // instance becomes usable again.
    this.isDestroyed = false;
    if (__DEV__) {
      logger.debug('EventManager initialized');
    }
  }

  /** Lifecycle: Cleanup */
  private onDestroy(): void {
    this.cleanup();
  }

  /**
   * Add event listener with tracking
   *
   * @param element - Target element
   * @param type - Event type
   * @param listener - Event handler
   * @param options - Listener options
   * @param context - Context for grouping (e.g., 'gallery-keyboard')
   * @returns Listener ID for removal, or null if registration failed
   */
  public addListener(
    element: EventTarget,
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions,
    context?: string
  ): string | null {
    if (this.isDestroyed) {
      logger.warn('EventManager: addListener called on destroyed instance');
      return null;
    }

    const id = registerManagedListener(element, type, listener, options, context);

    // The low-level backend always returns an id even if registration fails.
    // Track it anyway; cleanup will be a no-op if it was never registered.
    if (id) {
      this.ownedListenerContexts.set(id, context);
    }
    return id || null;
  }

  /**
   * Add event listener with an options object that can include a context.
   *
   * This method exists to match the project's guidance/examples and to reduce
   * API confusion between `addListener(..., options, context)` and an
   * `addEventListener(..., { context })` style.
   */
  public addEventListener(
    element: EventTarget,
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions & { context?: string }
  ): string | null {
    const normalized = (options ?? {}) as AddEventListenerOptions & { context?: string };
    const { context, ...listenerOptions } = normalized;
    return this.addListener(element, type, listener, listenerOptions, context);
  }

  /**
   * Remove event listener by ID
   */
  public removeListener(id: string): boolean {
    if (!this.ownedListenerContexts.has(id)) {
      return false;
    }

    this.ownedListenerContexts.delete(id);
    return removeEventListenerManaged(id);
  }

  /**
   * Remove all listeners matching a context
   */
  public removeByContext(context: string): number {
    const toRemove: string[] = [];
    for (const [id, ctx] of this.ownedListenerContexts) {
      if (ctx === context) {
        toRemove.push(id);
      }
    }

    let count = 0;
    for (const id of toRemove) {
      this.ownedListenerContexts.delete(id);
      if (removeEventListenerManaged(id)) {
        count++;
      }
    }

    return count;
  }

  /** Check if destroyed */
  public getIsDestroyed(): boolean {
    return this.isDestroyed;
  }

  /** Get listener statistics */
  public getListenerStatus() {
    if (!__DEV__) {
      return { total: 0, byContext: {}, byType: {} } as const;
    }

    return getEventListenerStatus();
  }

  /** Clean up and mark as destroyed */
  public cleanup(): void {
    if (this.isDestroyed) {
      return;
    }

    // Only remove listeners registered via this service instance. Never clear
    // the entire low-level registry to avoid affecting unrelated consumers.
    const ids = Array.from(this.ownedListenerContexts.keys());
    this.ownedListenerContexts.clear();

    for (const id of ids) {
      try {
        removeEventListenerManaged(id);
      } catch {
        // Swallow errors during cleanup to avoid cascading teardown failures.
      }
    }

    this.isDestroyed = true;
    if (__DEV__) {
      logger.debug('EventManager cleanup completed');
    }
  }
}
