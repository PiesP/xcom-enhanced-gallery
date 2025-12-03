/**
 * @fileoverview Signal Selector Optimization Utilities
 *
 * Efficiently select and memoize specific values from Signal state.
 * Prevent unnecessary re-renders to optimize performance.
 */

import { createMemo } from '@shared/external/vendors/solid-hooks';

// Type definitions
type Signal<T> = {
  /**
   * Current value of the signal. Accessing this inside Solid.js reactive
   * contexts will correctly register dependencies.
   */
  value: T;
};

/**
 * Selector function type
 */
export type SelectorFn<T, R> = (state: T) => R;

/**
 * Dependency extractor function type
 */
export type DependencyExtractor<T> = (state: T) => readonly unknown[];

/**
 * Memoized selector options
 */
export interface SelectorOptions<T> {
  /** Dependency extraction function (for memoization) */
  dependencies?: DependencyExtractor<T>;
}

/**
 * Create memoized selector (internal use only)
 */
function createSelector<T, R>(
  selector: SelectorFn<T, R>,
  options: SelectorOptions<T> = {}
): SelectorFn<T, R> {
  const { dependencies } = options;

  let lastArgs: T | undefined;
  let lastDependencies: readonly unknown[] | undefined;
  let lastResult: R;
  let hasResult = false;
  const optimizedSelector: SelectorFn<T, R> = (state: T): R => {
    // Object.is-based argument reference equality check
    if (hasResult && Object.is(lastArgs, state)) {
      return lastResult;
    }

    // Dependency-based caching
    if (dependencies) {
      const currentDependencies = dependencies(state);

      if (hasResult && lastDependencies && shallowEqual(lastDependencies, currentDependencies)) {
        return lastResult;
      }

      lastDependencies = currentDependencies;
    }

    // Compute new value
    const result = selector(state);

    // Cache arguments and result
    lastArgs = state;
    lastResult = result;
    hasResult = true;

    return result;
  };

  return optimizedSelector;
}

/**
 * Optimized hook for Signal
 *
 * @param signal - Preact Signal
 * @param selector - Selection function
 * @param options - Selector options
 * @returns Selected value
 */
export function useSelector<T, R>(
  signalInstance: Signal<T>,
  selector: SelectorFn<T, R>,
  options: SelectorOptions<T> = {}
): () => R {
  const memoizedSelector = createSelector(selector, options);

  const memo = createMemo(() => memoizedSelector(signalInstance.value));

  return memo;
}

/**
 * Shallow equality check for arrays
 */
function shallowEqual(a: readonly unknown[], b: readonly unknown[]): boolean {
  const { length } = a;

  if (length !== b.length) {
    return false;
  }

  for (let i = 0; i < length; i++) {
    if (!Object.is(a[i], b[i])) {
      return false;
    }
  }

  return true;
}
