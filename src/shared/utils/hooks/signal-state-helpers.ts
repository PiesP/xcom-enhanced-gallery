/**
 * @fileoverview Signal State Helpers
 * @description Phase 350: Solid.js signal-based state management utilities
 *
 * Wraps signal setters to provide type-safe and concise state updates.
 *
 * @module shared/utils/hooks/signal-state-helpers
 */

import { logger } from '@shared/logging';

/**
 * Signal Setter type
 */
export type SignalSetter<T> = (value: T | ((prev: T) => T)) => void;

/**
 * Signal Getter type
 */
export type SignalGetter<T> = () => T;

/**
 * Partial Update Helper
 *
 * Updates only some fields of an object signal.
 *
 * @example
 * ```typescript
 * const [state, setState] = createSignal({ count: 0, name: 'John' });
 *
 * updatePartial(setState, { count: 5 });
 * // { count: 5, name: 'John' }
 * ```
 */
export function updatePartial<T extends Record<string, unknown>>(
  setter: SignalSetter<T>,
  partial: Partial<T>
): void {
  setter(prev => ({ ...prev, ...partial }));
}

/**
 * Deep Merge Helper
 *
 * Merges nested objects deeply.
 *
 * @example
 * ```typescript
 * const [state, setState] = createSignal({
 *   user: { name: 'John', age: 30 },
 *   settings: { theme: 'dark' }
 * });
 *
 * mergeDeep(setState, {
 *   user: { age: 31 },
 *   settings: { fontSize: 14 }
 * });
 * // user: { name: 'John', age: 31 }, settings: { theme: 'dark', fontSize: 14 }
 * ```
 */
export function mergeDeep<T extends Record<string, unknown>>(
  setter: SignalSetter<T>,
  updates: Partial<T>
): void {
  setter(prev => {
    const merged = { ...prev };
    for (const key in updates) {
      if (Object.prototype.hasOwnProperty.call(updates, key)) {
        const value = updates[key];
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          merged[key] = {
            ...((prev[key] as Record<string, unknown>) || {}),
            ...value,
          } as T[Extract<keyof T, string>];
        } else {
          merged[key] = value as T[Extract<keyof T, string>];
        }
      }
    }
    return merged;
  });
}

/**
 * Reset to Initial Helper
 *
 * Resets signal to initial value.
 *
 * @example
 * ```typescript
 * const initialState = { count: 0 };
 * const [state, setState] = createSignal(initialState);
 *
 * setState({ count: 10 });
 * resetToInitial(setState, initialState);
 * // { count: 0 }
 * ```
 */
export function resetToInitial<T>(setter: SignalSetter<T>, initialValue: T): void {
  setter(initialValue);
}

/**
 * Conditional Update Helper
 *
 * Updates state only when condition is true.
 *
 * @example
 * ```typescript
 * const [count, setCount] = createSignal(0);
 *
 * updateIf(setCount, () => count(), prev => count() < 10, prev => prev + 1);
 * // Increment only if count < 10
 * ```
 */
export function updateIf<T>(
  setter: SignalSetter<T>,
  getter: SignalGetter<T>,
  condition: (current: T) => boolean,
  updater: (prev: T) => T
): boolean {
  const current = getter();
  if (condition(current)) {
    setter(updater);
    return true;
  }
  return false;
}

/**
 * Toggle Boolean Signal
 *
 * @example
 * ```typescript
 * const [isOpen, setIsOpen] = createSignal(false);
 *
 * toggle(setIsOpen);
 * // true
 * ```
 */
export function toggle(setter: SignalSetter<boolean>): void {
  setter(prev => !prev);
}

/**
 * Increment Number Signal
 *
 * @example
 * ```typescript
 * const [count, setCount] = createSignal(0);
 *
 * increment(setCount, 5);
 * // 5
 * ```
 */
export function increment(setter: SignalSetter<number>, amount = 1): void {
  setter(prev => prev + amount);
}

/**
 * Decrement Number Signal
 */
export function decrement(setter: SignalSetter<number>, amount = 1): void {
  setter(prev => prev - amount);
}

/**
 * Array Push Helper
 *
 * @example
 * ```typescript
 * const [items, setItems] = createSignal<number[]>([]);
 *
 * pushItem(setItems, 1, 2, 3);
 * // [1, 2, 3]
 * ```
 */
export function pushItem<T>(setter: SignalSetter<T[]>, ...items: T[]): void {
  setter(prev => [...prev, ...items]);
}

/**
 * Array Filter Helper
 *
 * @example
 * ```typescript
 * const [items, setItems] = createSignal([1, 2, 3, 4]);
 *
 * filterItems(setItems, x => x % 2 === 0);
 * // [2, 4]
 * ```
 */
export function filterItems<T>(
  setter: SignalSetter<T[]>,
  predicate: (item: T, index: number) => boolean
): void {
  setter(prev => prev.filter(predicate));
}

/**
 * Array Map Helper
 *
 * @example
 * ```typescript
 * const [numbers, setNumbers] = createSignal([1, 2, 3]);
 *
 * mapItems(setNumbers, x => x * 2);
 * // [2, 4, 6]
 * ```
 */
export function mapItems<T>(
  setter: SignalSetter<T[]>,
  mapper: (item: T, index: number) => T
): void {
  setter(prev => prev.map(mapper));
}

/**
 * Update Item at Index
 *
 * @example
 * ```typescript
 * const [items, setItems] = createSignal(['a', 'b', 'c']);
 *
 * updateItemAt(setItems, () => items(), 1, 'B');
 * // ['a', 'B', 'c']
 * ```
 */
export function updateItemAt<T>(
  setter: SignalSetter<T[]>,
  getter: SignalGetter<T[]>,
  index: number,
  value: T
): void {
  const current = getter();
  if (index < 0 || index >= current.length) {
    logger.warn('[SignalHelpers] Index out of bounds', { index, length: current.length });
    return;
  }
  setter(prev => {
    const copy = [...prev];
    copy[index] = value;
    return copy;
  });
}

/**
 * Remove Item at Index
 *
 * @example
 * ```typescript
 * const [items, setItems] = createSignal(['a', 'b', 'c']);
 *
 * removeItemAt(setItems, () => items(), 1);
 * // ['a', 'c']
 * ```
 */
export function removeItemAt<T>(
  setter: SignalSetter<T[]>,
  getter: SignalGetter<T[]>,
  index: number
): void {
  const current = getter();
  if (index < 0 || index >= current.length) {
    logger.warn('[SignalHelpers] Index out of bounds', { index, length: current.length });
    return;
  }
  setter(prev => prev.filter((_, i) => i !== index));
}

/**
 * Batch Update Helper
 *
 * Updates multiple signals simultaneously using Solid.js batch.
 *
 * @example
 * ```typescript
 * import { getSolid } from '@shared/external/vendors';
 * const { batch } = getSolid();
 *
 * const [count, setCount] = createSignal(0);
 * const [name, setName] = createSignal('');
 *
 * batchUpdate(batch, () => {
 *   setCount(10);
 *   setName('John');
 * });
 * // Single rendering cycle
 * ```
 */
export function batchUpdate(batchFn: (fn: () => void) => void, updates: () => void): void {
  batchFn(updates);
}
