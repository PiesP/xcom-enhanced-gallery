/**
 * @fileoverview Signal Selector Optimization Utilities
 *
 * Efficiently select and memoize specific values from Signal state.
 * Prevent unnecessary re-renders to optimize performance.
 */

import { getSolid } from '@shared/external/vendors';
import { globalTimerManager } from './timer-management';

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
 * Create memoized selector
 *
 * @param selector - Selection function
 * @param options - Selector options
 * @returns Optimized selector function
 */
export function createSelector<T, R>(
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
    if (hasResult && lastArgs && Object.is(lastArgs, state)) {
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
 * Signal용 최적화된 Hook
 *
 * @param signal - Preact Signal
 * @param selector - 선택 함수
 * @param options - 셀렉터 옵션
 * @returns 선택된 값
 */
export function useSelector<T, R>(
  signalInstance: Signal<T>,
  selector: SelectorFn<T, R>,
  options: SelectorOptions<T> = {}
): () => R {
  const { createMemo } = getSolid();

  const memoizedSelector = createSelector(selector, options);

  const memo = createMemo(() => memoizedSelector(signalInstance.value));

  return memo;
}

/**
 * 여러 Signal을 조합하는 Hook
 *
 * @param signals - Signal 배열
 * @param combiner - 조합 함수
 * @param dependencies - 의존성 추출 함수
 * @returns 조합된 값
 */
export function useCombinedSelector<T extends readonly Signal<unknown>[], R>(
  signals: T,
  combiner: (...values: { [K in keyof T]: T[K] extends Signal<infer U> ? U : never }) => R,
  dependencies?: (
    ...values: { [K in keyof T]: T[K] extends Signal<infer U> ? U : never }
  ) => readonly unknown[]
): () => R {
  const { createMemo } = getSolid();

  let lastDependencies: readonly unknown[] | undefined;
  let lastResult: R;
  let hasResult = false;

  const memo = createMemo(() => {
    const values = signals.map(signal => signal.value) as {
      [K in keyof T]: T[K] extends Signal<infer U> ? U : never;
    };

    if (dependencies) {
      const currentDependencies = dependencies(...values);

      if (hasResult && lastDependencies && shallowEqual(lastDependencies, currentDependencies)) {
        return lastResult;
      }

      lastDependencies = currentDependencies;
    }

    const result = combiner(...values);
    lastResult = result;
    hasResult = true;
    return result;
  });

  return memo;
}

/**
 * 비동기 셀렉터 Hook
 *
 * @param signal - Preact Signal
 * @param asyncSelector - 비동기 선택 함수
 * @param defaultValue - 기본값
 * @param debounceMs - 디바운스 시간 (밀리초)
 * @returns 선택된 값과 로딩 상태
 */
export function useAsyncSelector<T, R>(
  signalInstance: Signal<T>,
  asyncSelector: (state: T) => Promise<R>,
  defaultValue: R,
  debounceMs = 300
): () => { value: R; loading: boolean; error: Error | null } {
  const { createSignal, createEffect, onCleanup } = getSolid();

  const [result, setResult] = createSignal<{ value: R; loading: boolean; error: Error | null }>({
    value: defaultValue,
    loading: false,
    error: null,
  });

  let debounceTimer: number | null = null;
  let generation = 0;

  const clearTimer = () => {
    if (debounceTimer !== null) {
      globalTimerManager.clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  };

  const runSelector = async (state: T) => {
    const currentGeneration = ++generation;

    setResult(prev => ({
      value: prev.value,
      loading: true,
      error: null,
    }));

    try {
      const value = await asyncSelector(state);

      if (currentGeneration === generation) {
        setResult({ value, loading: false, error: null });
      }
    } catch (error) {
      if (currentGeneration === generation) {
        setResult(prev => ({
          value: prev.value,
          loading: false,
          error: error instanceof Error ? error : new Error(String(error)),
        }));
      }
    }
  };

  createEffect(() => {
    const state = signalInstance.value;
    clearTimer();
    debounceTimer = globalTimerManager.setTimeout(() => {
      void runSelector(state);
    }, debounceMs);
  });

  onCleanup(() => {
    clearTimer();
  });

  return result;
}

/**
 * 얕은 비교 함수
 */
function shallowEqual(a: readonly unknown[], b: readonly unknown[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) {
      return false;
    }
  }

  return true;
}
