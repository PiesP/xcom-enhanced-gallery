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

      observer.unobserve(element);
      observer.disconnect();

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
   */
  unobserve(element: Element): void {
    const set = observerRegistry.get(element);
    if (!set || set.size === 0) {
      return;
    }

    for (const observer of set) {
      observer.disconnect();
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
