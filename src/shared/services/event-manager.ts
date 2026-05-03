/**
 * @fileoverview Event Manager — singleton facade over the low-level listener manager.
 * Provides context-based cleanup and lifecycle integration.
 */

import { logger } from '@shared/logging/logger';
import {
  getEventListenerStatus,
  addListener as registerManagedListener,
  removeEventListenerManaged,
} from '@shared/utils/events/core/listener-manager';

let _eventManagerInstance: EventManager | null = null;

/**
 * Singleton EventManager with context-based listener grouping.
 */
export class EventManager {
  private _initialized = false;
  private isDestroyed = false;

  // Only tracks listeners registered through this instance so cleanup() does
  // not accidentally remove listeners owned by unrelated code paths that share
  // the underlying listener manager.
  private readonly ownedListenerContexts = new Map<string, string | undefined>();

  private constructor() {}

  /** Get singleton instance */
  public static getInstance(): EventManager {
    if (!_eventManagerInstance) _eventManagerInstance = new EventManager();
    return _eventManagerInstance;
  }

  /** @internal Test helper */
  public static resetForTests(): void {
    _eventManagerInstance?.cleanup();
    _eventManagerInstance = null;
  }

  /** Initialize service (idempotent) */
  public async initialize(): Promise<void> {
    if (this._initialized) return;
    this.isDestroyed = false;
    if (__DEV__) logger.debug('EventManager initialized');
    this._initialized = true;
  }

  /** Destroy service (idempotent) */
  public destroy(): void {
    if (!this._initialized) return;
    this.cleanup();
    this._initialized = false;
  }

  /** Check if service is initialized */
  public isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * Add event listener with tracking and optional context for grouping.
   *
   * @param element - Target element
   * @param type - Event type
   * @param listener - Event handler
   * @param options - Listener options (may include context for grouping)
   * @returns Listener ID for removal, or null if registration failed
   */
  public addEventListener(
    element: EventTarget,
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions & { context?: string }
  ): string | null {
    if (this.isDestroyed) {
      logger.warn('EventManager: addEventListener called on destroyed instance');
      return null;
    }

    const normalized = (options ?? {}) as AddEventListenerOptions & { context?: string };
    const { context, ...listenerOptions } = normalized;
    const id = registerManagedListener(element, type, listener, listenerOptions, context);

    if (id) {
      this.ownedListenerContexts.set(id, context);
    }
    return id || null;
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
