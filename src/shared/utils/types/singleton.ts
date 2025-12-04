/**
 * Shared helper for creating lazy singleton accessors.
 */
export interface SingletonController<T> {
  /** Lazily build (and cache) the singleton instance. */
  get(): T;
  /** Reset the cached instance (used in tests). */
  reset(): void;
}

export function createSingleton<T>(factory: () => T): SingletonController<T> {
  let instance: T | null = null;

  return {
    get(): T {
      if (instance === null) {
        instance = factory();
      }
      return instance;
    },
    reset(): void {
      instance = null;
    },
  };
}
