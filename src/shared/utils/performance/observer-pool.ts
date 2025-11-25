const observerPool = new Map<string, IntersectionObserver>();
const elementObserverMap = new WeakMap<Element, IntersectionObserver>();
const elementCallbackMap = new WeakMap<Element, (entry: IntersectionObserverEntry) => void>();

export const SharedObserver = {
  observe(
    element: Element,
    callback: (entry: IntersectionObserverEntry) => void,
    options: IntersectionObserverInit = {},
  ) {
    const key = `${options.rootMargin}|${options.threshold}`;
    let observer = observerPool.get(key);
    if (!observer) {
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          const cb = elementCallbackMap.get(entry.target);
          if (cb) cb(entry);
        });
      }, options);
      observerPool.set(key, observer);
    }
    elementObserverMap.set(element, observer);
    elementCallbackMap.set(element, callback);
    observer.observe(element);
  },

  unobserve(element: Element) {
    const observer = elementObserverMap.get(element);
    if (observer) {
      observer.unobserve(element);
      elementObserverMap.delete(element);
      elementCallbackMap.delete(element);
    }
  },
};
