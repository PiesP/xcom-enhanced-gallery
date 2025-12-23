/**
 * @fileoverview Promise callback helpers
 * @description Utilities for converting callback-based APIs to Promises
 */

/**
 * Generic result callback signature
 */
type ResultCallback<TResult, TError = string | null | undefined> = (
  result?: TResult,
  error?: TError
) => void;

/**
 * Void callback with only error parameter
 */
type VoidCallback<TError = string | null | undefined> = (error?: TError) => void;

/**
 * Options for promisifying callback-based APIs
 */
interface PromisifyOptions<TFallback> {
  /** Called when the primary method fails */
  fallback?: () => TFallback | Promise<TFallback>;
  /** Context for error logging */
  context?: string;
}

/**
 * Converts a callback-based method to a Promise.
 * Handles error cases and optional fallback logic.
 *
 * @example
 * ```typescript
 * // With GM_cookie.list
 * const cookies = await promisifyCallback<CookieRecord[]>(
 *   (callback) => gmCookie.list(options, callback),
 *   { fallback: () => this.listFromDocument(options) }
 * );
 * ```
 *
 * @param executor - Function that receives the callback
 * @param options - Options for fallback and context
 * @returns Promise resolving to the result
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
 *
 * @example
 * ```typescript
 * await promisifyVoidCallback(
 *   (callback) => gmCookie.set(details, callback)
 * );
 * ```
 *
 * @param executor - Function that receives the callback
 * @returns Promise that resolves when callback is called without error
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
 * A minimal Deferred implementation.
 *
 * Prefer this when you need to bridge event/callback-based APIs to async/await
 * while keeping resolve/reject handles in local scope.
 */
interface Deferred<T> {
  readonly promise: Promise<T>;
  readonly resolve: (value: T | PromiseLike<T>) => void;
  readonly reject: (reason?: unknown) => void;
}

/**
 * Create a Deferred promise with exposed resolve/reject.
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
