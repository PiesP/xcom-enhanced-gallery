import { logger } from '@shared/logging/logger';

let didLogCallbackErrorInDev = false;

/**
 * Minimal IntersectionObserver pool implementation.
 *
 * Creates one IntersectionObserver per subscription. This design avoids
 * pooling/registry complexity and keeps the runtime small while maintaining
 * efficient observer lifecycle management.
 *
 * The registry uses WeakMap to automatically clean up when elements are
 * garbage collected, preventing memory leaks from DOM nodes.
 */
let observerRegistry = new WeakMap<Element, Set<IntersectionObserver>>();

/**
 * Shared IntersectionObserver utility for observing element visibility changes.
 *
 * Handles safe error catching and provides automatic cleanup on unsubscribe.
 * Errors in callbacks are swallowed to prevent interrupting other callbacks,
 * with optional development-time logging for the first error.
 */
export const SharedObserver = {
  /**
   * Observe an element for visibility changes.
   *
   * @param element - DOM element to observe
   * @param callback - Invoked for each IntersectionObserverEntry
   * @param options - IntersectionObserver init options (optional)
   * @returns Unsubscribe function that stops observing and cleans up
   *
   * @example
   * ```typescript
   * const unsubscribe = SharedObserver.observe(element, (entry) => {
   *   console.log('Visible:', entry.isIntersecting);
   * });
   * // Later:
   * unsubscribe();  // stops observing and disconnects
   * ```
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
   * Stop observing an element and disconnect all its observers.
   *
   * Safely disconnects all IntersectionObservers registered for the element.
   * Errors during disconnection are silently ignored as part of best-effort cleanup.
   *
   * @param element - DOM element to stop observing
   *
   * @example
   * ```typescript
   * SharedObserver.unobserve(element);  // disconnect all observers for element
   * ```
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
 * Reset internal registry state for test isolation.
 *
 * **WARNING**: Not intended for production use. This is a test-only helper
 * that clears the observer registry and error logging flag. Call this in
 * test cleanup (teardown) to ensure test isolation.
 *
 * @internal Test helper only
 *
 * @example
 * ```typescript
 * // In test teardown:
 * _resetSharedObserverForTests();
 * ```
 */
export function _resetSharedObserverForTests(): void {
  observerRegistry = new WeakMap();
  didLogCallbackErrorInDev = false;
}
