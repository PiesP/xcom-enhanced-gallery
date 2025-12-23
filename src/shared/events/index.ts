/**
 * Legacy event subscription helpers.
 *
 * Note: This module exists primarily to support the test suite and any
 * remaining internal integrations that still rely on the older API.
 */

export type SubscriptionId = number;

type SubscriptionEntry = {
  readonly unsubscribe: () => void;
  readonly detachAbortListener: (() => void) | null;
};

export class SubscriptionManager {
  private nextId = 1;
  private readonly subscriptions = new Map<SubscriptionId, SubscriptionEntry>();

  public get size(): number {
    return this.subscriptions.size;
  }

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

export class AppEventManager {
  private readonly listeners = new Map<string, Set<(...args: unknown[]) => void>>();

  public constructor(private readonly subscriptions: SubscriptionManager) {}

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

export class DOMEventManager {
  public constructor(private readonly subscriptions: SubscriptionManager) {}

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
