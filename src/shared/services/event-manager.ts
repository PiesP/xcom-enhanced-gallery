/**
 * @fileoverview Event Manager — singleton managing DOM event listener registration,
 * context-based cleanup, and lifecycle integration.
 */

import { logger } from '@shared/logging/logger';

// ============================================================================
// Shared Types (moved from dom-listener-context.ts)
// ============================================================================

/**
 * Gallery event handler callback signatures.
 */
export interface EventHandlers {
  readonly onMediaClick: (element: HTMLElement, event: MouseEvent) => Promise<void>;
  readonly onGalleryClose: () => void;
  readonly onKeyboardEvent?: (event: KeyboardEvent) => void;
}

/**
 * Gallery event configuration.
 */
export interface GalleryEventOptions {
  readonly enableKeyboard: boolean;
  readonly enableMediaDetection: boolean;
  readonly debugMode: boolean;
  readonly preventBubbling: boolean;
  readonly context: string;
}

/**
 * Media click handling result.
 */
export interface EventHandlingResult {
  readonly handled: boolean;
  readonly reason?: string;
}

// ============================================================================
// Internal listener registry (previously in listener-manager.ts)
// ============================================================================

interface ListenerContext {
  readonly id: string;
  readonly element: EventTarget;
  readonly type: string;
  readonly listener: EventListenerOrEventListenerObject;
  readonly options?: boolean | AddEventListenerOptions;
  readonly context: string | undefined;
}

// ============================================================================
// EventManager
// ============================================================================

let _eventManagerInstance: EventManager | null = null;

/**
 * Singleton EventManager with context-based listener grouping.
 */
export class EventManager {
  private _initialized = false;
  private isDestroyed = false;

  private readonly listeners = new Map<string, ListenerContext>();
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

    if (!element || typeof element.addEventListener !== 'function') {
      if (__DEV__) {
        logger.warn('[EventManager] Invalid element for addEventListener', { type, context });
      }
      return null;
    }

    try {
      element.addEventListener(type, listener, listenerOptions);

      const id = context
        ? `${context}:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
        : crypto.randomUUID().replaceAll('-', '');

      const ctx: ListenerContext = {
        id,
        element,
        type,
        listener,
        options: listenerOptions,
        context,
      };
      this.listeners.set(id, ctx);
      this.ownedListenerContexts.set(id, context);

      return id;
    } catch (error) {
      if (__DEV__) {
        logger.error('[EventManager] Failed to add listener', { type, context, error });
      }
      return null;
    }
  }

  /**
   * Remove event listener by ID.
   */
  public removeListener(id: string): boolean {
    if (!this.ownedListenerContexts.has(id)) {
      return false;
    }

    this.ownedListenerContexts.delete(id);
    return this.removeListenerById(id);
  }

  /**
   * Remove all listeners matching a context.
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
      if (this.removeListenerById(id)) {
        count++;
      }
    }

    return count;
  }

  /** Check if destroyed */
  public getIsDestroyed(): boolean {
    return this.isDestroyed;
  }

  /** Get listener statistics (dev only) */
  public getListenerStatus() {
    if (!__DEV__) {
      return { total: 0, byContext: {}, byType: {} } as const;
    }

    const byContext: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const ctx of this.listeners.values()) {
      const c = ctx.context || 'default';
      byContext[c] = (byContext[c] || 0) + 1;
      byType[ctx.type] = (byType[ctx.type] || 0) + 1;
    }

    return { total: this.listeners.size, byContext, byType };
  }

  /** Clean up and mark as destroyed */
  public cleanup(): void {
    if (this.isDestroyed) return;

    const ids = Array.from(this.ownedListenerContexts.keys());
    this.ownedListenerContexts.clear();

    for (const id of ids) {
      try {
        this.removeListenerById(id);
      } catch {
        // Swallow errors during cleanup
      }
    }

    this.isDestroyed = true;
    if (__DEV__) {
      logger.debug('EventManager cleanup completed');
    }
  }

  /**
   * Remove a listener from the registry and DOM by ID.
   */
  private removeListenerById(id: string): boolean {
    const ctx = this.listeners.get(id);
    if (!ctx) {
      if (__DEV__) {
        logger.warn('[EventManager] Listener not found for removal', { id });
      }
      return false;
    }

    try {
      ctx.element.removeEventListener(ctx.type, ctx.listener, ctx.options);
      this.listeners.delete(id);
      return true;
    } catch (error) {
      if (__DEV__) {
        logger.error('[EventManager] Failed to remove listener', { id, type: ctx.type, error });
      }
      return false;
    }
  }
}
