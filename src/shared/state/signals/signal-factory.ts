/**
 * Safe signal factory with Solid.js fallback support for tests/Node environments
 */

import { logger } from '@shared/logging';
import { getSolid } from '@shared/external/vendors';

export type SafeSignal<T> = {
  value: T;
  subscribe: (callback: (value: T) => void) => () => void;
};

function getSolidOrNull(): ReturnType<typeof getSolid> | null {
  try {
    return getSolid();
  } catch {
    logger.warn('Solid.js not available, using fallback');
    return null;
  }
}

/**
 * Create a reactive signal with Solid.js or fallback observer pattern
 */
export function createSignalSafe<T>(initial: T): SafeSignal<T> {
  const solid = getSolidOrNull();

  if (solid) {
    const { createSignal, createRoot, createEffect } = solid;
    const [read, write] = createSignal(initial, { equals: false });

    const signalObject = {
      subscribe(callback: (value: T) => void): () => void {
        try {
          return createRoot(dispose => {
            createEffect(() => callback(read()));
            return dispose;
          });
        } catch (error) {
          logger.warn('Solid subscribe failed', { error });
          return () => {};
        }
      },
    } as SafeSignal<T>;

    Object.defineProperty(signalObject, 'value', {
      get: () => read(),
      set: (v: T) => {
        try {
          write(() => v);
        } catch (error) {
          logger.warn('Solid write failed', { error });
        }
      },
      enumerable: true,
    });

    return signalObject;
  }

  // Fallback: simple observer pattern
  let _value = initial;
  const listeners = new Set<(v: T) => void>();

  return {
    get value() {
      return _value;
    },
    set value(v: T) {
      _value = v;
      try {
        listeners.forEach(l => l(_value));
      } catch (error) {
        logger.warn('Notify failed', { error });
      }
    },
    subscribe(callback: (value: T) => void): () => void {
      try {
        callback(_value);
      } catch {
        // ignore
      }
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
  } as SafeSignal<T>;
}

/**
 * Create a reactive effect with Solid.js or single execution fallback
 */
export function effectSafe(fn: () => void): () => void {
  const solid = getSolidOrNull();
  if (solid) {
    try {
      const { createRoot, createEffect } = solid;
      return createRoot(dispose => {
        createEffect(() => fn());
        return dispose;
      });
    } catch (error) {
      logger.warn('Solid effect failed', { error });
    }
  }
  try {
    fn();
  } catch {
    // ignore
  }
  return () => {};
}

/**
 * Create a memoized computed value with Solid.js or lazy evaluation fallback
 */
export function computedSafe<T>(compute: () => T): { readonly value: T } {
  const solid = getSolidOrNull();
  if (solid) {
    try {
      const { createRoot, createMemo } = solid;
      let memoAccessor: (() => T) | null = null;

      createRoot(dispose => {
        memoAccessor = createMemo(compute);
        return () => {
          memoAccessor = null;
          dispose();
        };
      });

      return {
        get value() {
          try {
            return memoAccessor ? memoAccessor() : compute();
          } catch (error) {
            logger.warn('Solid memo access failed', { error });
            return compute();
          }
        },
      } as const;
    } catch (error) {
      logger.warn('Solid computed failed', { error });
    }
  }
  return {
    get value() {
      return compute();
    },
  } as const;
}
