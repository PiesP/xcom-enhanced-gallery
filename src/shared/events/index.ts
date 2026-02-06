/**
 * @fileoverview Event subscription and management utilities
 * @description Legacy event helpers for subscriptions and DOM/app event management
 */

export type SubscriptionId = number;

type SubscriptionEntry = {
  readonly unsubscribe: () => void;
  readonly detachAbortListener: (() => void) | null;
};

/**
 * Manages event subscriptions with automatic cleanup via AbortSignal integration
 */
export class SubscriptionManager {
  private nextId = 1;
  private readonly subscriptions = new Map<SubscriptionId, SubscriptionEntry>();

  public get size(): number {
    return this.subscriptions.size;
  }

  /**
   * Add subscription with optional AbortSignal support
   * @param unsubscribe - Callback to invoke when removed
   * @param options - Configuration including AbortSignal
   * @returns Subscription ID for later removal
   */
  public add(unsubscribe: () => void, options?: { signal?: AbortSignal }): SubscriptionId {
    const id = this.nextId++;

    let detachAbortListener: (() => void) | null = null;

    const signal = options?.signal;
    if (signal) {
      const onAbort = () => this.remove(id);
      signal.addEventListener('abort', onAbort, { once: true });
      detachAbortListener = () => signal.removeEventListener('abort', onAbort);
    }

    this.subscriptions.set(id, { unsubscribe, detachAbortListener });

    return id;
  }

  /**
   * Remove subscription by ID and invoke unsubscribe callback
   * @param id - Subscription ID from add()
   * @returns true if found and removed
   */
  public remove(id: SubscriptionId): boolean {
    const entry = this.subscriptions.get(id);
    if (!entry) return false;

    entry.detachAbortListener?.();
    try {
      entry.unsubscribe();
    } finally {
      this.subscriptions.delete(id);
    }
    return true;
  }
}

/**
 * Manages application-level custom events with automatic cleanup
 */
export class AppEventManager {
  private readonly listeners = new Map<string, Set<(...args: unknown[]) => void>>();

  public constructor(private readonly subscriptions: SubscriptionManager) {}

  /**
   * Register event listener for custom event
   * @param eventName - Event name
   * @param callback - Handler to invoke on emission
   * @param options - Configuration including AbortSignal
   * @returns Unsubscribe function
   */
  public on(
    eventName: string,
    callback: (...args: unknown[]) => void,
    options?: { signal?: AbortSignal }
  ): () => void {
    const set = this.listeners.get(eventName) ?? new Set();
    set.add(callback);
    this.listeners.set(eventName, set);

    const id = this.subscriptions.add(
      () => {
        const current = this.listeners.get(eventName);
        current?.delete(callback);
        if (current && current.size === 0) {
          this.listeners.delete(eventName);
        }
      },
      options?.signal ? { signal: options.signal } : undefined
    );

    return () => {
      this.subscriptions.remove(id);
    };
  }
}

/**
 * Manages DOM event listeners with automatic cleanup
 */
export class DOMEventManager {
  public constructor(private readonly subscriptions: SubscriptionManager) {}

  /**
   * Add DOM event listener with automatic cleanup tracking
   * @param target - EventTarget to attach listener
   * @param type - Event type (e.g., 'click', 'keydown')
   * @param handler - Event handler
   * @param options - Configuration (signal, capture, passive, once, context)
   * @returns Subscription ID for manual removal
   */
  public addListener(
    target: EventTarget,
    type: string,
    handler: EventListener,
    options?: {
      signal?: AbortSignal;
      context?: string;
      capture?: boolean;
      passive?: boolean;
      once?: boolean;
    }
  ): SubscriptionId {
    const listenerOptions: AddEventListenerOptions = {};
    if (options?.capture !== undefined) listenerOptions.capture = options.capture;
    if (options?.passive !== undefined) listenerOptions.passive = options.passive;
    if (options?.once !== undefined) listenerOptions.once = options.once;

    target.addEventListener(type, handler, listenerOptions);

    return this.subscriptions.add(
      () => {
        target.removeEventListener(type, handler, listenerOptions);
      },
      options?.signal ? { signal: options.signal } : undefined
    );
  }
}
