/**
 * Shared helper for creating lazy singleton accessors.
 */
export interface SingletonController<T> {
  /** Lazily build (and cache) the singleton instance. */
  get(): T;
  /** Return the cached instance without creating it. */
  peek?: () => T | null;
  /** Reset the cached instance (used in tests). */
  reset?: () => void;
}

export function createSingleton<T>(factory: () => T): SingletonController<T> {
  let hasInstance = false;
  let instance: T;

  const get = (): T => {
    if (!hasInstance) {
      instance = factory();
      hasInstance = true;
    }
    return instance;
  };

  if (!__DEV__) {
    return { get };
  }

  const peek = (): T | null => (hasInstance ? instance : null);
  const reset = (): void => {
    hasInstance = false;
  };

  return { get, peek, reset };
}
