/**
 * @fileoverview Promise callback helpers
 * @description Utilities for converting callback-based APIs to Promises
 */

/**
 * Generic result callback signature
 */
export type ResultCallback<TResult, TError = string | null | undefined> = (
  result?: TResult,
  error?: TError
) => void;

/**
 * Void callback with only error parameter
 */
export type VoidCallback<TError = string | null | undefined> = (error?: TError) => void;

/**
 * Options for promisifying callback-based APIs
 */
export interface PromisifyOptions<TFallback> {
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
      executor(error => {
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
 * Wraps a function that may throw with optional fallback.
 *
 * @param fn - Function to execute
 * @param fallback - Fallback value or function if fn throws
 * @returns Result of fn or fallback
 */
export function tryWithFallback<T>(fn: () => T, fallback: T | (() => T)): T {
  try {
    return fn();
  } catch {
    return typeof fallback === 'function' ? (fallback as () => T)() : fallback;
  }
}

/**
 * Async version of tryWithFallback
 */
export async function tryWithFallbackAsync<T>(
  fn: () => T | Promise<T>,
  fallback: T | (() => T | Promise<T>)
): Promise<T> {
  try {
    return await fn();
  } catch {
    return typeof fallback === 'function' ? await (fallback as () => T | Promise<T>)() : fallback;
  }
}
