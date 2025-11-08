/**
 * @fileoverview Example Hooks using Common Utilities
 * @description Phase 350: Common utility usage examples
 * @module shared/utils/hooks/examples
 */

import { getSolid } from '@shared/external/vendors';
import {
  createManagedIntersectionObserver,
  createTimerGroup,
  createDebouncedFunction,
  updatePartial,
  toggle,
} from './index';

/**
 * useIntersectionObserver Hook
 *
 * Detects if an element is visible in the viewport.
 *
 * @example
 * ```typescript
 * const { isIntersecting } = useIntersectionObserver(
 *   () => elementRef.current,
 *   { threshold: 0.5 }
 * );
 *
 * createEffect(() => {
 *   console.log('Visible:', isIntersecting());
 * });
 * ```
 */
export function useIntersectionObserver(
  target: () => HTMLElement | null,
  options?: { threshold?: number | number[]; rootMargin?: string }
) {
  const { createSignal, onCleanup } = getSolid();
  const [isIntersecting, setIsIntersecting] = createSignal(false);

  const observer = createManagedIntersectionObserver(entries => {
    entries.forEach(entry => {
      setIsIntersecting(entry.isIntersecting);
    });
  }, options);

  const el = target();
  if (el) {
    observer.observe(el);
  }

  onCleanup(() => observer.disconnect());

  return { isIntersecting };
}

/**
 * useDebouncedValue Hook
 *
 * Debounces value changes.
 *
 * @example
 * ```typescript
 * const [searchQuery, setSearchQuery] = createSignal('');
 * const debouncedQuery = useDebouncedValue(() => searchQuery(), 300);
 *
 * createEffect(() => {
 *   // API call is debounced for 300ms
 *   fetchResults(debouncedQuery());
 * });
 * ```
 */
export function useDebouncedValue<T>(getValue: () => T, delay: number): () => T {
  const { createSignal, createEffect, onCleanup } = getSolid();
  const [debouncedValue, setDebouncedValue] = createSignal(getValue());

  const updateValue = createDebouncedFunction((...args: unknown[]) => {
    const newValue = args[0] as T;
    setDebouncedValue(newValue as Parameters<typeof setDebouncedValue>[0]);
  }, delay);

  createEffect(() => {
    const currentValue = getValue();
    updateValue(currentValue);
  });

  onCleanup(() => updateValue.cancel());

  return debouncedValue;
}

/**
 * useInterval Hook
 *
 * Executes callback periodically.
 *
 * @example
 * ```typescript
 * const [count, setCount] = createSignal(0);
 *
 * useInterval(() => {
 *   setCount(prev => prev + 1);
 * }, 1000);
 * ```
 */
export function useInterval(callback: () => void, delay: number, enabled = true) {
  const { onCleanup } = getSolid();
  const timers = createTimerGroup();

  if (enabled) {
    timers.setInterval(callback, delay);
  }

  onCleanup(() => timers.cancelAll());

  return { timers };
}

/**
 * useTimeout Hook
 *
 * Executes callback after delay.
 *
 * @example
 * ```typescript
 * const { reset, cancel } = useTimeout(() => {
 *   console.log('Timeout!');
 * }, 3000);
 *
 * // Restart timer
 * reset();
 *
 * // Cancel timer
 * cancel();
 * ```
 */
export function useTimeout(callback: () => void, delay: number) {
  const { onCleanup } = getSolid();
  const timers = createTimerGroup();

  const start = () => {
    timers.cancelAll();
    timers.setTimeout(callback, delay);
  };

  start();

  onCleanup(() => timers.cancelAll());

  return {
    reset: start,
    cancel: () => timers.cancelAll(),
  };
}

/**
 * useToggle Hook
 *
 * Toggles boolean state.
 *
 * @example
 * ```typescript
 * const [isOpen, toggleOpen] = useToggle(false);
 *
 * <button onClick={toggleOpen}>Toggle</button>
 * <div hidden={!isOpen()}>Content</div>
 * ```
 */
export function useToggle(
  initialValue = false
): [() => boolean, () => void, (value: boolean) => void] {
  const { createSignal } = getSolid();
  const [value, setValue] = createSignal(initialValue);

  const toggleValue = () => toggle(setValue);

  return [value, toggleValue, setValue];
}

/**
 * useCounter Hook
 *
 * Manages numeric counter state.
 *
 * @example
 * ```typescript
 * const { count, increment, decrement, reset } = useCounter(0);
 *
 * <button onClick={() => increment(5)}>+5</button>
 * <div>{count()}</div>
 * <button onClick={() => decrement(2)}>-2</button>
 * <button onClick={reset}>Reset</button>
 * ```
 */
export function useCounter(initialValue = 0) {
  const { createSignal } = getSolid();
  const [count, setCount] = createSignal(initialValue);

  return {
    count,
    increment: (amount = 1) => setCount(prev => prev + amount),
    decrement: (amount = 1) => setCount(prev => prev - amount),
    reset: () => setCount(initialValue),
    set: setCount,
  };
}

/**
 * useObjectState Hook
 *
 * Manages object state with partial updates.
 *
 * @example
 * ```typescript
 * const { state, update, reset } = useObjectState({
 *   name: 'John',
 *   age: 30,
 *   email: 'john@example.com'
 * });
 *
 * // Partial update
 * update({ age: 31 });
 *
 * // Reset to initial value
 * reset();
 * ```
 */
export function useObjectState<T extends Record<string, unknown>>(initialValue: T) {
  const { createSignal } = getSolid();
  const [state, setState] = createSignal(initialValue);

  return {
    state,
    update: (partial: Partial<T>) => updatePartial(setState, partial),
    reset: () => setState(() => initialValue),
    set: setState,
  };
}
