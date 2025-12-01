/**
 * Safe signal factory
 */

import {
  createEffect,
  createMemo,
  createRoot,
  createSignal,
} from '@shared/external/vendors/solid-hooks';
import { logger } from '@shared/logging';

export type SafeSignal<T> = {
  value: T;
  subscribe: (callback: (value: T) => void) => () => void;
};

/**
 * Create a reactive signal with Solid.js
 */
export function createSignalSafe<T>(initial: T): SafeSignal<T> {
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

/**
 * Create a reactive effect with Solid.js
 */
export function effectSafe(fn: () => void): () => void {
  try {
    return createRoot(dispose => {
      createEffect(() => fn());
      return dispose;
    });
  } catch (error) {
    logger.warn('Solid effect failed', { error });
    return () => {};
  }
}

/**
 * Create a memoized computed value with Solid.js
 */
export function computedSafe<T>(compute: () => T): { readonly value: T } {
  try {
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
    return {
      get value() {
        return compute();
      },
    } as const;
  }
}
