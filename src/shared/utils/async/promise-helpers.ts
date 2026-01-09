/**
 * @fileoverview Promise callback helpers
 * @description Utilities for converting callback-based APIs to Promises
 */

import type {
  Deferred,
  PromisifyOptions,
  ResultCallback,
  VoidCallback,
} from './promise-helpers.types';

/**
 * Converts a callback-based method to a Promise.
 * Handles error cases and optional fallback logic.
 * @template TResult - The type of value the callback receives on success
 * @param executor - Function that receives the callback, invoked once with result or error
 * @param options - Optional fallback handler and context for error logging
 * @returns Promise resolving to the result on success, or fallback value on error
 * @throws Error if callback reports an error and no fallback is provided
 */
export function promisifyCallback<TResult>(
  executor: (callback: ResultCallback<TResult>) => void,
  options?: PromisifyOptions<TResult>
): Promise<TResult> {
  return new Promise((resolve, reject) => {
    try {
      executor((result, error) => {
        if (error) {
          if (options?.fallback) {
            resolve(Promise.resolve(options.fallback()));
          } else {
            reject(new Error(String(error)));
          }
          return;
        }
        resolve(result as TResult);
      });
    } catch (error) {
      if (options?.fallback) {
        resolve(Promise.resolve(options.fallback()));
      } else {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    }
  });
}

/**
 * Converts a void callback-based method to a Promise.
 * Use this for callback-based APIs that only report errors, not values.
 * @param executor - Function that receives the callback, invoked once with optional error
 * @returns Promise that resolves when callback is called without error
 * @throws Error if callback reports an error
 */
export function promisifyVoidCallback(executor: (callback: VoidCallback) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      executor((error) => {
        if (error) {
          reject(new Error(String(error)));
          return;
        }
        resolve();
      });
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

/**
 * Create a Deferred promise with exposed resolve/reject handlers.
 * A Deferred represents a Promise with exposed resolve/reject handlers.
 * @template T - The type of value the promise resolves to
 * @returns A Deferred object with promise, resolve, and reject properties
 * @example
 * const deferred = createDeferred<string>();
 * deferred.resolve('done');
 * const result = await deferred.promise; // 'done'
 */
export function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}
