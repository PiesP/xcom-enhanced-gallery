/**
 * @fileoverview Example Hooks using Common Utilities
 * @description Phase 350: 공통 유틸리티 활용 예제
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
 * Element가 뷰포트에 나타나는지 감지합니다.
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
 * 값의 변경을 debounce합니다.
 *
 * @example
 * ```typescript
 * const [searchQuery, setSearchQuery] = createSignal('');
 * const debouncedQuery = useDebouncedValue(() => searchQuery(), 300);
 *
 * createEffect(() => {
 *   // API 호출은 300ms debounce
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
 * 주기적으로 콜백을 실행합니다.
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
 * 지연 후 콜백을 실행합니다.
 *
 * @example
 * ```typescript
 * const { reset, cancel } = useTimeout(() => {
 *   console.log('Timeout!');
 * }, 3000);
 *
 * // 타이머 재시작
 * reset();
 *
 * // 타이머 취소
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
 * Boolean 상태를 토글합니다.
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
 * 숫자 카운터 상태를 관리합니다.
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
 * 객체 상태를 부분 업데이트합니다.
 *
 * @example
 * ```typescript
 * const { state, update, reset } = useObjectState({
 *   name: 'John',
 *   age: 30,
 *   email: 'john@example.com'
 * });
 *
 * // 부분 업데이트
 * update({ age: 31 });
 *
 * // 초기값으로 리셋
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
