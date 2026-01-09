import { logger } from '@shared/logging/logger';

let didLogCallbackErrorInDev = false;

/**
 * IntersectionObserver pool using WeakMap for automatic cleanup
 */
let observerRegistry = new WeakMap<Element, Set<IntersectionObserver>>();

/** Shared IntersectionObserver utility for visibility changes */
export const SharedObserver = {
  /**
   * Observe element for visibility changes
   *
   * @param element - DOM element to observe
   * @param callback - Called for each IntersectionObserverEntry
   * @param options - Init options
   * @returns Unsubscribe function
   */
  observe(
    element: Element,
    callback: (entry: IntersectionObserverEntry) => void,
    options: IntersectionObserverInit = {}
  ): () => void {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        try {
          callback(entry);
        } catch (error) {
          // Swallow errors to avoid interrupting other callbacks.
          // In DEV, log the first failure to improve observability without spamming.
          if (__DEV__ && !didLogCallbackErrorInDev) {
            didLogCallbackErrorInDev = true;
            logger.warn('[SharedObserver] IntersectionObserver callback threw', error);
          }
        }
      }
    }, options);

    observer.observe(element);

    let set = observerRegistry.get(element);
    if (!set) {
      set = new Set();
      observerRegistry.set(element, set);
    }
    set.add(observer);

    let isActive = true;

    const unsubscribe = (): void => {
      if (!isActive) {
        return;
      }
      isActive = false;

      try {
        observer.unobserve(element);
      } catch {
        // Ignore: unobserve should be best-effort.
      }

      try {
        observer.disconnect();
      } catch {
        // Ignore: disconnect should be best-effort.
      }

      const currentSet = observerRegistry.get(element);
      if (currentSet) {
        currentSet.delete(observer);
        if (currentSet.size === 0) {
          observerRegistry.delete(element);
        }
      }
    };

    return unsubscribe;
  },

  /**
   * Stop observing element and disconnect all observers
   *
   * @param element - DOM element to stop observing
   */
  unobserve(element: Element): void {
    const set = observerRegistry.get(element);
    if (!set || set.size === 0) {
      return;
    }

    for (const observer of set) {
      try {
        observer.disconnect();
      } catch {
        // Ignore: disconnect should be best-effort.
      }
    }

    observerRegistry.delete(element);
  },
};

/**
 * Reset registry for test isolation (test-only helper)
 * @internal
 */
export function _resetSharedObserverForTests(): void {
  observerRegistry = new WeakMap();
  didLogCallbackErrorInDev = false;
}
