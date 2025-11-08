/**
 * @fileoverview Signal Selector Optimization
 * @description Signal selector performance optimization through memoization
 */

import { getSolid } from '../../external/vendors';
import { globalTimerManager } from '../timer-management';
import { logger } from '../../logging';

/**
 * Selector function type
 */
type SelectorFunction<T, R> = (state: T) => R;

/**
 * Memoized selector factory function
 * Uses Object.is for reference identity comparison to prevent unnecessary recalculation
 */
export function createSelector<T, R>(
  selector: SelectorFunction<T, R>,
  debug = false
): SelectorFunction<T, R> {
  let lastInput: T;
  let lastOutput: R;
  let hasResult = false;

  return (input: T): R => {
    if (hasResult && Object.is(input, lastInput)) {
      if (debug) {
        logger.debug('[Signal Selector] Cache hit');
      }
      return lastOutput;
    }

    lastInput = input;
    lastOutput = selector(input);
    hasResult = true;

    if (debug) {
      logger.debug('[Signal Selector] Cache miss');
    }

    return lastOutput;
  };
}

/**
 * Async selector result
 */
interface AsyncSelectorResult<T> {
  value: T;
  loading: boolean;
  error: Error | null;
}

/**
 * Async selector hook
 * Request optimization through debouncing
 */
export function useAsyncSelector<T, R>(
  state: { value: T } | T,
  selector: (state: T) => Promise<R>,
  defaultValue: R,
  debounceMs = 300
): () => AsyncSelectorResult<R> {
  const { createSignal, createEffect, onCleanup } = getSolid();

  const [result, setResult] = createSignal<AsyncSelectorResult<R>>({
    value: defaultValue,
    loading: false,
    error: null,
  });

  // Phase 281: useRef → let variable (Solid.js idiomatic)
  let mounted = true;
  let currentGeneration = 0;

  createEffect(() => {
    const sourceValue =
      (state as { value?: T })?.value !== undefined ? (state as { value: T }).value : (state as T);

    currentGeneration = (currentGeneration ?? 0) + 1;
    const generation = currentGeneration;

    setResult(prev => ({ ...prev, loading: true, error: null }));

    const timeoutId = globalTimerManager.setTimeout(async () => {
      if (!mounted || generation !== currentGeneration) {
        return;
      }

      try {
        const value = await selector(sourceValue);
        if (mounted && generation === currentGeneration) {
          setResult({ value, loading: false, error: null });
        }
      } catch (error) {
        if (mounted && generation === currentGeneration) {
          setResult({
            value: defaultValue,
            loading: false,
            error: error instanceof Error ? error : new Error('Unknown error'),
          });
        }
      }
    }, debounceMs);

    onCleanup(() => {
      globalTimerManager.clearTimeout(timeoutId);
    });
  });

  createEffect(() => {
    onCleanup(() => {
      mounted = false;
    });
  });

  return result;
}

/**
 * useSelector Hook
 * Hook for selecting values from signal
 */
export function useSelector<T, R>(
  signal: { value: T },
  selector: (value: T) => R,
  deps?: unknown[]
): () => R {
  const { createMemo } = getSolid();

  return createMemo(() => selector(signal.value), deps ? [signal.value, ...deps] : [signal.value]);
}

/**
 * useCombinedSelector Hook
 * Hook for combining multiple signals
 */
export function useCombinedSelector<T1, T2, R>(
  signal1: { value: T1 },
  signal2: { value: T2 },
  selector: (value1: T1, value2: T2) => R
): () => R {
  const { createMemo } = getSolid();

  return createMemo(() => selector(signal1.value, signal2.value), [signal1.value, signal2.value]);
}
