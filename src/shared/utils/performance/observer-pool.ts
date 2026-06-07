// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { logger } from '@shared/logging/logger';

/**
 * True shared IntersectionObserver pool — keyed by options.
 *
 * Before: each `observe()` call created a NEW `IntersectionObserver` instance,
 * resulting in N+V observers per gallery open (one per item + one per video).
 *
 * After: observers are pooled by serialized options. Only one observer exists
 * per unique configuration, regardless of how many elements are observed.
 * For this project: 2 unique configs → exactly 2 observers (not N+V).
 */

/** Map from serialized options → shared observer + per-element callbacks. */
const observerPool = new Map<
  string,
  {
    readonly observer: IntersectionObserver;
    readonly callbacks: WeakMap<Element, (entry: IntersectionObserverEntry) => void>;
    readonly refCount: Map<Element, number>; // one element can be observed multiple times
  }
>();

/** Serialize options into a stable key (sorted keys for determinism). */
function optionsKey(options: IntersectionObserverInit): string {
  // root is always null (viewport) in this codebase; omit it to keep keys simple
  const threshold = options.threshold;
  const rootMargin = options.rootMargin ?? '0px';
  const t =
    typeof threshold === 'number'
      ? threshold
      : Array.isArray(threshold)
        ? threshold.join(',')
        : '0';
  return `t:${t}|m:${rootMargin}`;
}

export const SharedObserver = {
  observe(
    element: Element,
    callback: (entry: IntersectionObserverEntry) => void,
    options: IntersectionObserverInit = {}
  ): () => void {
    const key = optionsKey(options);

    let entry = observerPool.get(key);
    if (!entry) {
      const callbacks = new WeakMap<Element, (entry: IntersectionObserverEntry) => void>();
      const refCount = new Map<Element, number>();

      const observer = new IntersectionObserver((entries) => {
        for (const e of entries) {
          const cb = callbacks.get(e.target);
          if (cb) {
            try {
              cb(e);
            } catch (error) {
              __DEV__ && logger.warn('[SharedObserver] callback threw', error);
            }
          }
        }
      }, options);

      entry = { observer, callbacks, refCount };
      observerPool.set(key, entry);
    }

    entry.callbacks.set(element, callback);
    entry.refCount.set(element, (entry.refCount.get(element) ?? 0) + 1);
    entry.observer.observe(element);

    let disposed = false;

    return (): void => {
      if (disposed) return;
      disposed = true;

      const poolEntry = observerPool.get(key);
      if (!poolEntry) return;

      // Remove callback
      poolEntry.callbacks.delete(element);
      poolEntry.observer.unobserve(element);

      // Decrement ref count; if this element is still observed by another caller, keep observing
      const count = (poolEntry.refCount.get(element) ?? 1) - 1;
      if (count <= 0) {
        poolEntry.refCount.delete(element);
      } else {
        poolEntry.refCount.set(element, count);
        // Re-observe with the remaining callback (which may be from a different caller)
        poolEntry.observer.observe(element);
      }

      // If no more elements tracked by this observer, clean it up
      if (poolEntry.refCount.size === 0) {
        poolEntry.observer.disconnect();
        observerPool.delete(key);
      }
    };
  },

  unobserve(element: Element): void {
    const keysToRemove: string[] = [];
    for (const [key, poolEntry] of observerPool) {
      if (!poolEntry.refCount.has(element)) continue;

      poolEntry.callbacks.delete(element);
      poolEntry.refCount.delete(element);
      poolEntry.observer.unobserve(element);

      if (poolEntry.refCount.size === 0) {
        poolEntry.observer.disconnect();
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      observerPool.delete(key);
    }
  },
};
