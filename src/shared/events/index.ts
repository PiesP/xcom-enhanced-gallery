/**
 * Legacy event subscription helpers.
 *
 * Note: This module exists primarily to support the test suite and any
 * remaining internal integrations that still rely on the older API.
 */

/**
 * Unique identifier for a subscription.
 */
export type SubscriptionId = number;

/**
 * Internal subscription entry with unsubscribe callback and optional abort listener.
 */
type SubscriptionEntry = {
  readonly unsubscribe: () => void;
  readonly detachAbortListener: (() => void) | null;
};

/**
 * Manages event subscriptions with automatic cleanup support.
 *
 * Tracks subscriptions and provides AbortSignal integration for automatic
 * cleanup when signals are aborted.
 */
export class SubscriptionManager {
  private nextId = 1;
  private readonly subscriptions = new Map<SubscriptionId, SubscriptionEntry>();

  /**
   * Returns the number of active subscriptions.
   */
  public get size(): number {
    return this.subscriptions.size;
  }

  /**
   * Adds a new subscription with optional AbortSignal support.
   *
   * @param unsubscribe - Callback to invoke when subscription is removed
   * @param options - Optional configuration
   * @param options.signal - AbortSignal to automatically remove subscription on abort
   * @returns Unique subscription ID for later removal
   */
  public add(unsubscribe: () => void, options?: { signal?: AbortSignal }): SubscriptionId {
    const id = this.nextId++;

    let detachAbortListener: (() => void) | null = null;

    const signal = options?.signal;
    if (signal) {
      const onAbort = () => {
        // If remove() already happened, this will be a no-op.
        this.remove(id);
      };

      signal.addEventListener('abort', onAbort, { once: true });
      detachAbortListener = () => {
        signal.removeEventListener('abort', onAbort);
      };
    }

    this.subscriptions.set(id, { unsubscribe, detachAbortListener });

    return id;
  }

  /**
   * Removes a subscription by ID and invokes its unsubscribe callback.
   *
   * @param id - Subscription ID returned from add()
   * @returns true if subscription was found and removed, false otherwise
   */
  public remove(id: SubscriptionId): boolean {
    const entry = this.subscriptions.get(id);
    if (!entry) {
      return false;
    }

    // Important: detach abort listener before running unsubscribe to avoid
    // re-entrancy if unsubscribe triggers abort-related logic.
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
 * Manages application-level custom events with subscription tracking.
 *
 * Provides pub-sub pattern for custom application events with automatic
 * cleanup via SubscriptionManager.
 */
export class AppEventManager {
  private readonly listeners = new Map<string, Set<(...args: unknown[]) => void>>();

  /**
   * Creates a new AppEventManager instance.
   *
   * @param subscriptions - SubscriptionManager instance for tracking event subscriptions
   */
  public constructor(private readonly subscriptions: SubscriptionManager) {}

  /**
   * Registers an event listener for a custom event.
   *
   * @param eventName - Name of the custom event
   * @param callback - Function to invoke when event is emitted
   * @param options - Optional configuration
   * @param options.signal - AbortSignal to automatically remove listener on abort
   * @returns Unsubscribe function to remove the listener
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
 * Manages DOM event listeners with subscription tracking.
 *
 * Provides centralized DOM event management with automatic cleanup via
 * SubscriptionManager and support for AbortSignal integration.
 */
export class DOMEventManager {
  /**
   * Creates a new DOMEventManager instance.
   *
   * @param subscriptions - SubscriptionManager instance for tracking DOM event listeners
   */
  public constructor(private readonly subscriptions: SubscriptionManager) {}

  /**
   * Adds a DOM event listener with automatic cleanup tracking.
   *
   * @param target - DOM EventTarget to attach listener to
   * @param type - Event type (e.g., 'click', 'keydown')
   * @param handler - Event handler function
   * @param options - Optional configuration
   * @param options.signal - AbortSignal to automatically remove listener on abort
   * @param options.context - Debug context label for logging
   * @param options.capture - Use capture phase
   * @param options.passive - Mark listener as passive
   * @param options.once - Remove listener after first invocation
   * @returns Subscription ID for manual removal via SubscriptionManager
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
    // Keep listener options explicit and stable for removeEventListener.
    // With exactOptionalPropertyTypes, do not assign undefined.
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
